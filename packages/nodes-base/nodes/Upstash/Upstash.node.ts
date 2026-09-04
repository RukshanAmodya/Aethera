import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Upstash implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash Redis',
		name: 'upstash',
		icon: { light: 'file:upstash.svg', dark: 'file:upstash.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Serverless Redis caching, key-value storage, and rate-limiting with Upstash HTTP REST API',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["key"]}}',
		defaults: {
			name: 'Upstash Redis',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'upstashApi',
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
						name: 'Get Value',
						value: 'get',
						description: 'Get the value of a key',
						action: 'Get the value of a key',
					},
					{
						name: 'Set Value',
						value: 'set',
						description: 'Set string value of a key with optional TTL',
						action: 'Set string value of a key with optional TTL',
					},
					{
						name: 'Delete Key',
						value: 'del',
						description: 'Delete a key',
						action: 'Delete a key',
					},
					{
						name: 'Increment Key',
						value: 'incr',
						description: 'Increment integer value of a key by 1',
						action: 'Increment integer value of a key by 1',
					},
					{
						name: 'Custom REST Command',
						value: 'custom',
						description: 'Run arbitrary Redis command via Upstash REST API',
						action: 'Run arbitrary Redis command via Upstash REST API',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					hide: {
						operation: ['custom'],
					},
				},
				description: 'The Redis key',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				description: 'The value to store',
			},
			{
				displayName: 'TTL (Seconds)',
				name: 'ttl',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['set'],
					},
				},
				description: 'Expiration time in seconds (0 = no expiration)',
			},
			{
				displayName: 'Command & Arguments',
				name: 'commandArgs',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['custom'],
					},
				},
				placeholder: 'HSET user:100 name Alice email alice@example.com',
				description: 'Space-separated command and arguments to pass to Upstash REST API',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const creds = await this.getCredentials('upstashApi');
				const baseUrl = (creds.url as string).replace(/\/$/, '');

				let path = '';
				let body: IDataObject | IDataObject[] | string[] | undefined = undefined;
				let method: IHttpRequestMethods = 'GET';

				if (operation === 'get') {
					const key = this.getNodeParameter('key', i) as string;
					path = `/get/${encodeURIComponent(key)}`;
				} else if (operation === 'set') {
					const key = this.getNodeParameter('key', i) as string;
					const value = this.getNodeParameter('value', i) as string;
					const ttl = this.getNodeParameter('ttl', i, 0) as number;

					if (ttl > 0) {
						path = `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${ttl}`;
					} else {
						path = `/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
					}
				} else if (operation === 'del') {
					const key = this.getNodeParameter('key', i) as string;
					path = `/del/${encodeURIComponent(key)}`;
				} else if (operation === 'incr') {
					const key = this.getNodeParameter('key', i) as string;
					path = `/incr/${encodeURIComponent(key)}`;
				} else if (operation === 'custom') {
					const commandArgs = this.getNodeParameter('commandArgs', i) as string;
					const parts = commandArgs.split(/\s+/).filter(Boolean);
					path = '/';
					method = 'POST';
					body = parts;
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'upstashApi',
					{
						method,
						url: `${baseUrl}${path}`,
						...(body ? { body } : {}),
						json: true,
					},
				)) as { result?: unknown; error?: string };

				let resultData: unknown = response.result;
				if (typeof resultData === 'string') {
					try {
						resultData = JSON.parse(resultData);
					} catch {
						// keep as string
					}
				}

				returnData.push({
					json: {
						result: resultData as IDataObject,
						raw: response as unknown as IDataObject,
					},
					pairedItem: { item: i },
				});
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
