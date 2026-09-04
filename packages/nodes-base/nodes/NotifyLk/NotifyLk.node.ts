import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class NotifyLk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notify.lk (Sri Lanka SMS)',
		name: 'notifyLk',
		icon: 'file:notifylk.svg',
		group: ['transform'],
		version: 1,
		description: 'Send high-speed bulk & transactional SMS in Sri Lanka using Notify.lk Gateway',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["to"]}}',
		defaults: {
			name: 'Notify.lk',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'notifyLkApi',
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
						name: 'Send SMS',
						value: 'sendSms',
						description: 'Send an SMS message to a Sri Lankan or international phone number',
						action: 'Send an SMS',
					},
					{
						name: 'Check Account Balance',
						value: 'getBalance',
						description: 'Check remaining SMS credits/balance',
						action: 'Check account balance',
					},
				],
				default: 'sendSms',
			},
			{
				displayName: 'Recipient Number (To)',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				placeholder: '94771234567 or 0771234567',
				displayOptions: {
					show: {
						operation: ['sendSms'],
					},
				},
				description: 'Recipient mobile phone number',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendSms'],
					},
				},
				description: 'The SMS text message content (English, Sinhala, or Tamil supported)',
			},
			{
				displayName: 'Custom Sender ID (Optional)',
				name: 'senderId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendSms'],
					},
				},
				description: 'Override the default sender ID configured in credentials',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const creds = await this.getCredentials('notifyLkApi');
				const userId = creds.userId as string;
				const apiKey = creds.apiKey as string;
				const defaultSenderId = (creds.senderId as string) || 'NotifyDEMO';

				if (operation === 'sendSms') {
					let to = (this.getNodeParameter('to', i) as string).trim();
					// Normalize local number 07XXXXXXXX to 947XXXXXXXX
					if (to.startsWith('0') && to.length === 10) {
						to = '94' + to.substring(1);
					}

					const message = this.getNodeParameter('message', i) as string;
					const customSenderId = this.getNodeParameter('senderId', i, '') as string;
					const senderId = customSenderId || defaultSenderId;

					const response = (await this.helpers.httpRequest({
						method: 'POST',
						url: 'https://app.notify.lk/api/v1/send',
						body: {
							user_id: userId,
							api_key: apiKey,
							sender_id: senderId,
							to,
							message,
						},
						json: true,
					})) as IDataObject;

					returnData.push({
						json: {
							success: response.status === 'success',
							to,
							senderId,
							response,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'getBalance') {
					const response = (await this.helpers.httpRequest({
						method: 'GET',
						url: 'https://app.notify.lk/api/v1/status',
						qs: {
							user_id: userId,
							api_key: apiKey,
						},
						json: true,
					})) as IDataObject;

					returnData.push({
						json: response,
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
