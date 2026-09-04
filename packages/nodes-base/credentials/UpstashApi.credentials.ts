import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class UpstashApi implements ICredentialType {
	name = 'upstashApi';

	displayName = 'Upstash Redis API';

	documentationUrl = 'https://docs.upstash.com/redis/features/restapi';

	properties: INodeProperties[] = [
		{
			displayName: 'REST URL',
			name: 'url',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://xxxx.upstash.io',
			description: 'The REST URL provided in your Upstash Redis database dashboard',
		},
		{
			displayName: 'REST Token',
			name: 'token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'The REST Token provided in your Upstash Redis database dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.url }}',
			url: '/ping',
			method: 'GET',
		},
	};
}
