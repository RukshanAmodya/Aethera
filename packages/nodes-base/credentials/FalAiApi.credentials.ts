import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FalAiApi implements ICredentialType {
	name = 'falAiApi';

	displayName = 'fal.ai API';

	documentationUrl = 'https://docs.fal.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'fal.ai API key (format: Key id:secret)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Key {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://queue.fal.run',
			url: '/fal-ai/flux/dev',
			method: 'POST',
			body: {
				prompt: 'a red apple',
				image_size: 'square_hd',
				num_inference_steps: 1,
			},
		},
	};
}
