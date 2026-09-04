import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Mem0 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mem0',
		name: 'mem0',
		icon: { light: 'file:mem0.svg', dark: 'file:mem0.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Long-term personalized AI memory and user state retention with Mem0',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["userId"]}}',
		defaults: {
			name: 'Mem0',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'mem0Api',
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
						name: 'Add Memory',
						value: 'add',
						description: 'Add new user messages or facts to long-term memory',
						action: 'Add memory',
					},
					{
						name: 'Search Memories',
						value: 'search',
						description: 'Search memories by semantic relevance for a user',
						action: 'Search memories',
					},
					{
						name: 'Get All Memories',
						value: 'getAll',
						description: 'Retrieve all stored memories for a user',
						action: 'Get all memories',
					},
					{
						name: 'Delete Memory',
						value: 'delete',
						description: 'Delete a specific memory by ID',
						action: 'Delete a memory',
					},
				],
				default: 'search',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					hide: {
						operation: ['delete'],
					},
				},
				description: 'The unique ID representing the user / customer (e.g. user_123 or email)',
			},
			{
				displayName: 'Messages / Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['add'],
					},
				},
				description: 'The conversation message or factual information to remember',
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				description: 'The natural language query to find relevant memories for',
			},
			{
				displayName: 'Memory ID',
				name: 'memoryId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				description: 'The ID of the memory to delete',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const creds = await this.getCredentials('mem0Api');
				const baseUrl = (creds.url as string).replace(/\/$/, '');

				if (operation === 'add') {
					const userId = this.getNodeParameter('userId', i) as string;
					const content = this.getNodeParameter('content', i) as string;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'mem0Api',
						{
							method: 'POST',
							url: `${baseUrl}/v1/memories/`,
							body: {
								messages: [{ role: 'user', content }],
								user_id: userId,
							},
							json: true,
						},
					)) as IDataObject;

					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				} else if (operation === 'search') {
					const userId = this.getNodeParameter('userId', i) as string;
					const query = this.getNodeParameter('query', i) as string;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'mem0Api',
						{
							method: 'POST',
							url: `${baseUrl}/v1/memories/search/`,
							body: {
								query,
								user_id: userId,
							},
							json: true,
						},
					)) as IDataObject[];

					const results = Array.isArray(response) ? response : [response];
					returnData.push({
						json: {
							query,
							userId,
							memories: results,
							count: results.length,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'getAll') {
					const userId = this.getNodeParameter('userId', i) as string;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'mem0Api',
						{
							method: 'GET',
							url: `${baseUrl}/v1/memories/`,
							qs: {
								user_id: userId,
							},
							json: true,
						},
					)) as IDataObject[];

					const results = Array.isArray(response) ? response : [response];
					returnData.push({
						json: {
							userId,
							memories: results,
							count: results.length,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'delete') {
					const memoryId = this.getNodeParameter('memoryId', i) as string;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'mem0Api',
						{
							method: 'DELETE',
							url: `${baseUrl}/v1/memories/${memoryId}/`,
							json: true,
						},
					)) as IDataObject;

					returnData.push({
						json: {
							success: true,
							memoryId,
							response,
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
