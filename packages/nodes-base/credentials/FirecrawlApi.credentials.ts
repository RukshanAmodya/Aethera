import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FirecrawlApi implements ICredentialType {
	name = 'firecrawlApi';

	displayName = 'Firecrawl API';

	documentationUrl = 'https://docs.firecrawl.dev';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'string',
			default: 'https://api.firecrawl.dev',
			description: 'Base URL for Firecrawl cloud or self-hosted instance',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.url }}',
			url: '/v1/scrape',
			method: 'POST',
			body: {
				url: 'https://example.com',
			},
		},
	};
}
