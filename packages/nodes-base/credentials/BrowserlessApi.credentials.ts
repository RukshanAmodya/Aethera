import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BrowserlessApi implements ICredentialType {
	name = 'browserlessApi';

	displayName = 'Browserless API';

	documentationUrl = 'https://docs.browserless.io';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: false,
			default: '',
			description: 'API token for browserless.io cloud (optional for self-hosted instances)',
		},
		{
			displayName: 'Host URL',
			name: 'url',
			type: 'string',
			default: 'https://chrome.browserless.io',
			description: 'Base URL of the Browserless instance',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				token: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.url }}',
			url: '/content',
			method: 'POST',
			body: {
				url: 'https://example.com',
			},
		},
	};
}
