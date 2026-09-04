import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NotifyLkApi implements ICredentialType {
	name = 'notifyLkApi';

	displayName = 'Notify.lk API';

	documentationUrl = 'https://developer.notify.lk';

	properties: INodeProperties[] = [
		{
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			required: true,
			default: '',
			description: 'Your Notify.lk User ID',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Notify.lk API Key',
		},
		{
			displayName: 'Sender ID',
			name: 'senderId',
			type: 'string',
			default: 'NotifyDEMO',
			description: 'Your approved SMS Sender ID (e.g. NotifyDEMO or your registered company name)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.notify.lk/api/v1',
			url: '/status',
			method: 'GET',
		},
	};
}
