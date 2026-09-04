import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class JinaReader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jina Reader',
		name: 'jinaReader',
		icon: { light: 'file:jinareader.svg', dark: 'file:jinareader.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Convert any URL to clean LLM markdown or search the web with Jina AI Reader API',
		subtitle: '={{$parameter["mode"] + ": " + $parameter["input"]}}',
		defaults: {
			name: 'Jina Reader',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'jinaAiApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Read URL (Convert to Markdown)',
						value: 'read',
						description: 'Fetch any web URL as clean markdown text for LLM prompts',
					},
					{
						name: 'Web Search (Search Grounding)',
						value: 'search',
						description: 'Search the web using Jina Search and get top ranked markdown results',
					},
				],
				default: 'read',
			},
			{
				displayName: 'Target URL',
				name: 'input',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
				displayOptions: {
					show: {
						mode: ['read'],
					},
				},
				description: 'The URL to read and parse into markdown',
			},
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Latest advancements in AI agents 2026',
				displayOptions: {
					show: {
						mode: ['search'],
					},
				},
				description: 'The query to search the web for',
			},
			{
				displayName: 'With Generated Summary',
				name: 'withSummary',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						mode: ['read'],
					},
				},
				description: 'Whether to ask Jina to prepend an executive summary of the page',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const mode = this.getNodeParameter('mode', i) as string;

				let jinaApiKey: string | undefined;
				try {
					const creds = await this.getCredentials('jinaAiApi');
					jinaApiKey = creds.apiKey as string;
				} catch {
					// Optional
				}

				const headers: IDataObject = {
					Accept: 'application/json',
				};
				if (jinaApiKey) {
					headers.Authorization = `Bearer ${jinaApiKey}`;
				}

				if (mode === 'read') {
					const targetUrl = this.getNodeParameter('input', i) as string;
					const withSummary = this.getNodeParameter('withSummary', i) as boolean;
					if (withSummary) {
						headers['X-With-Generated-Alt'] = 'true';
					}

					const response = (await this.helpers.httpRequest({
						method: 'GET',
						url: `https://r.jina.ai/${targetUrl}`,
						headers,
						json: true,
					})) as { code?: number; status?: number; data?: { title?: string; content?: string; url?: string; description?: string } };

					const resData = response.data || {};
					returnData.push({
						json: {
							title: resData.title || '',
							content: resData.content || '',
							description: resData.description || '',
							url: targetUrl,
						},
						pairedItem: { item: i },
					});
				} else {
					const searchQuery = this.getNodeParameter('searchQuery', i) as string;
					const response = (await this.helpers.httpRequest({
						method: 'GET',
						url: `https://s.jina.ai/${encodeURIComponent(searchQuery)}`,
						headers,
						json: true,
					})) as { data?: Array<{ title?: string; url?: string; content?: string; description?: string }> };

					returnData.push({
						json: {
							query: searchQuery,
							results: response.data || [],
							count: (response.data || []).length,
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
