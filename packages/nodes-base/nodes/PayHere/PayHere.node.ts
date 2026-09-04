import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import * as crypto from 'crypto';

export class PayHere implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PayHere (Sri Lanka)',
		name: 'payHere',
		icon: 'file:payhere.svg',
		group: ['transform'],
		version: 1,
		description: 'Accept credit/debit cards, LankaQR, mobile wallets and verify PayHere payments',
		subtitle: '={{$parameter["operation"]}}',
		defaults: {
			name: 'PayHere',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'payHereApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Generate Checkout Hash & Parameters',
						value: 'generateHash',
						description: 'Generate payment hash signature and HTML checkout payload for orders',
						action: 'Generate payment hash',
					},
					{
						name: 'Verify IPN Webhook Signature',
						value: 'verifyIpn',
						description: 'Verify md5sig from PayHere instant payment notification callback',
						action: 'Verify IPN signature',
					},
				],
				default: 'generateHash',
			},
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				default: '',
				required: true,
				description: 'Unique order reference number',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 1000,
				required: true,
				description: 'Amount in currency (e.g. 1000.00)',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: [
					{ name: 'LKR (Sri Lankan Rupee)', value: 'LKR' },
					{ name: 'USD (US Dollar)', value: 'USD' },
					{ name: 'EUR (Euro)', value: 'EUR' },
					{ name: 'GBP (British Pound)', value: 'GBP' },
					{ name: 'AUD (Australian Dollar)', value: 'AUD' },
				],
				default: 'LKR',
			},
			{
				displayName: 'Items Description',
				name: 'items',
				type: 'string',
				default: 'Product or Service Payment',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
				description: 'Short description of items purchased',
			},
			{
				displayName: 'Customer First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
			},
			{
				displayName: 'Customer Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
			},
			{
				displayName: 'Customer Email',
				name: 'email',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
			},
			{
				displayName: 'Customer Phone',
				name: 'phone',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
			},
			{
				displayName: 'Return URL',
				name: 'returnUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
				description: 'URL to redirect customer upon success',
			},
			{
				displayName: 'Cancel URL',
				name: 'cancelUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
				description: 'URL to redirect customer upon cancellation',
			},
			{
				displayName: 'Notify (Webhook IPN) URL',
				name: 'notifyUrl',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHash'],
					},
				},
				description: 'Webhook callback endpoint on Aethera',
			},
			{
				displayName: 'Received MD5 Signature (md5sig)',
				name: 'receivedMd5Sig',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['verifyIpn'],
					},
				},
				description: 'The md5sig parameter sent in the PayHere IPN POST body',
			},
			{
				displayName: 'Status Code',
				name: 'statusCode',
				type: 'string',
				default: '2',
				displayOptions: {
					show: {
						operation: ['verifyIpn'],
					},
				},
				description: 'The status_code from PayHere (2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargedback)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const creds = await this.getCredentials('payHereApi');
				const merchantId = (creds.merchantId as string).trim();
				const merchantSecret = (creds.merchantSecret as string).trim();
				const isSandbox = creds.environment === 'sandbox';

				const orderId = this.getNodeParameter('orderId', i) as string;
				const amount = this.getNodeParameter('amount', i) as number;
				const currency = this.getNodeParameter('currency', i) as string;

				// Format amount with 2 decimal places e.g. 1000.00
				const formattedAmount = Number(amount).toFixed(2);

				// Hash calculation: strtoupper(md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))))
				const hashedSecret = crypto
					.createHash('md5')
					.update(merchantSecret)
					.digest('hex')
					.toUpperCase();

				if (operation === 'generateHash') {
					const hashString = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
					const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

					const checkoutUrl = isSandbox
						? 'https://sandbox.payhere.lk/pay/checkout'
						: 'https://www.payhere.lk/pay/checkout';

					const checkoutPayload: IDataObject = {
						sandbox: isSandbox,
						merchant_id: merchantId,
						return_url: this.getNodeParameter('returnUrl', i, '') as string,
						cancel_url: this.getNodeParameter('cancelUrl', i, '') as string,
						notify_url: this.getNodeParameter('notifyUrl', i, '') as string,
						order_id: orderId,
						items: this.getNodeParameter('items', i, '') as string,
						amount: formattedAmount,
						currency,
						hash,
						first_name: this.getNodeParameter('firstName', i, '') as string,
						last_name: this.getNodeParameter('lastName', i, '') as string,
						email: this.getNodeParameter('email', i, '') as string,
						phone: this.getNodeParameter('phone', i, '') as string,
						address: '',
						city: '',
						country: 'Sri Lanka',
					};

					returnData.push({
						json: {
							hash,
							checkoutUrl,
							payload: checkoutPayload,
							isSandbox,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'verifyIpn') {
					const receivedMd5Sig = this.getNodeParameter('receivedMd5Sig', i) as string;
					const statusCode = this.getNodeParameter('statusCode', i) as string;

					// IPN validation string: strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
					const checkString = `${merchantId}${orderId}${formattedAmount}${currency}${statusCode}${hashedSecret}`;
					const calculatedMd5Sig = crypto
						.createHash('md5')
						.update(checkString)
						.digest('hex')
						.toUpperCase();

					const isValid = calculatedMd5Sig === receivedMd5Sig.toUpperCase();
					const isSuccess = isValid && statusCode === '2';

					returnData.push({
						json: {
							isValid,
							isSuccess,
							statusCode,
							orderId,
							amount: formattedAmount,
							currency,
							statusDescription:
								statusCode === '2'
									? 'Success'
									: statusCode === '0'
										? 'Pending'
										: statusCode === '-1'
											? 'Canceled'
											: statusCode === '-2'
												? 'Failed'
												: statusCode === '-3'
													? 'Chargedback'
													: 'Unknown',
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
