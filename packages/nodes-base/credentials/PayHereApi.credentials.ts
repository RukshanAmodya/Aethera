import type {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PayHereApi implements ICredentialType {
	name = 'payHereApi';

	displayName = 'PayHere API';

	documentationUrl = 'https://support.payhere.lk/api-&-mobile-sdk';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Live (Production)',
					value: 'live',
				},
				{
					name: 'Sandbox (Testing)',
					value: 'sandbox',
				},
			],
			default: 'sandbox',
		},
		{
			displayName: 'Merchant ID',
			name: 'merchantId',
			type: 'string',
			required: true,
			default: '',
			description: 'Your PayHere Merchant ID from the Merchant Portal',
		},
		{
			displayName: 'Merchant Secret',
			name: 'merchantSecret',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your PayHere Merchant Secret for generating MD5 and HMAC signatures',
		},
		{
			displayName: 'App ID (Optional for OAuth / Refunds)',
			name: 'appId',
			type: 'string',
			default: '',
			description: 'Your PayHere App ID for API access',
		},
		{
			displayName: 'App Secret (Optional for OAuth / Refunds)',
			name: 'appSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your PayHere App Secret for API access',
		},
	];
}
