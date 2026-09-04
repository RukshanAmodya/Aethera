import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Firecrawl implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Firecrawl',
		name: 'firecrawl',
		icon: { light: 'file:firecrawl.svg', dark: 'file:firecrawl.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Turn entire websites and URLs into clean, LLM-ready markdown with Firecrawl',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["url"]}}',
		defaults: {
			name: 'Firecrawl',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'firecrawlApi',
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
						name: 'Scrape URL (Single Page)',
						value: 'scrape',
						description: 'Scrape a single URL into clean Markdown',
						action: 'Scrape URL to markdown',
					},
					{
						name: 'Crawl Website (Multi Page)',
						value: 'crawl',
						description: 'Crawl an entire website domain',
						action: 'Crawl website',
					},
					{
						name: 'Map Website (Fast Sitemap)',
						value: 'map',
						description: 'Quickly find all links / URLs belonging to a domain',
						action: 'Map website links',
					},
				],
				default: 'scrape',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://example.com',
				description: 'The URL to scrape or crawl',
			},
			{
				displayName: 'Formats',
				name: 'formats',
				type: 'multiOptions',
				options: [
					{ name: 'Markdown', value: 'markdown' },
					{ name: 'HTML', value: 'html' },
					{ name: 'Raw HTML', value: 'rawHtml' },
					{ name: 'Links', value: 'links' },
					{ name: 'Screenshot', value: 'screenshot' },
				],
				default: ['markdown'],
				displayOptions: {
					show: {
						operation: ['scrape'],
					},
				},
				description: 'The formats to extract from the page',
			},
			{
				displayName: 'Only Main Content',
				name: 'onlyMainContent',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['scrape'],
					},
				},
				description: 'Whether to strip headers, footers, and navs, keeping only article/main content',
			},
			{
				displayName: 'Wait for Selector (Milliseconds)',
				name: 'waitFor',
				type: 'number',
				default: 1000,
				displayOptions: {
					show: {
						operation: ['scrape'],
					},
				},
				description: 'Time in milliseconds to wait for JavaScript to finish rendering before scraping',
			},
			{
				displayName: 'Max Crawl Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				displayOptions: {
					show: {
						operation: ['crawl'],
					},
				},
				description: 'Maximum number of pages to crawl',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const targetUrl = this.getNodeParameter('url', i) as string;

				const creds = await this.getCredentials('firecrawlApi');
				const baseUrl = (creds.url as string) || 'https://api.firecrawl.dev';

				if (operation === 'scrape') {
					const formats = this.getNodeParameter('formats', i) as string[];
					const onlyMainContent = this.getNodeParameter('onlyMainContent', i) as boolean;
					const waitFor = this.getNodeParameter('waitFor', i) as number;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'firecrawlApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/scrape`,
							body: {
								url: targetUrl,
								formats,
								onlyMainContent,
								waitFor,
							},
							json: true,
						},
					)) as { success: boolean; data?: { markdown?: string; html?: string; metadata?: IDataObject } };

					const resData = response.data || {};
					returnData.push({
						json: {
							success: response.success,
							markdown: resData.markdown || '',
							metadata: resData.metadata || {},
							html: resData.html || '',
							url: targetUrl,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'map') {
					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'firecrawlApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/map`,
							body: {
								url: targetUrl,
							},
							json: true,
						},
					)) as { success: boolean; links?: string[] };

					returnData.push({
						json: {
							success: response.success,
							links: response.links || [],
							count: (response.links || []).length,
							url: targetUrl,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'crawl') {
					const limit = this.getNodeParameter('limit', i) as number;

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'firecrawlApi',
						{
							method: 'POST',
							url: `${baseUrl}/v1/crawl`,
							body: {
								url: targetUrl,
								limit,
							},
							json: true,
						},
					)) as { success: boolean; id: string; url: string };

					returnData.push({
						json: {
							...response,
							crawlId: response.id,
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
