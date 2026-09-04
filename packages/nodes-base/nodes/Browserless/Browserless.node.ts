import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Browserless implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Browserless',
		name: 'browserless',
		icon: { light: 'file:browserless.svg', dark: 'file:browserless.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Headless Chrome automation, web scraping, PDF generation, and screenshots via Browserless',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["url"]}}',
		defaults: {
			name: 'Browserless',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'browserlessApi',
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
						name: 'Take Screenshot',
						value: 'screenshot',
						description: 'Capture screenshot of a webpage',
						action: 'Take screenshot of webpage',
					},
					{
						name: 'Generate PDF',
						value: 'pdf',
						description: 'Render webpage as PDF document',
						action: 'Render webpage as PDF',
					},
					{
						name: 'Get Rendered HTML Content',
						value: 'content',
						description: 'Get full DOM HTML after executing JavaScript',
						action: 'Get rendered page content',
					},
				],
				default: 'screenshot',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://example.com',
				description: 'The URL of the webpage to load in Headless Chrome',
			},
			{
				displayName: 'Wait For Selector (Optional)',
				name: 'waitFor',
				type: 'string',
				default: '',
				description: 'CSS selector or timeout in milliseconds to wait before capturing',
			},
			{
				displayName: 'Full Page',
				name: 'fullPage',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['screenshot'],
					},
				},
				description: 'Whether to take a screenshot of the entire scrollable page',
			},
			{
				displayName: 'Put Output in Field',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						operation: ['screenshot', 'pdf'],
					},
				},
				description: 'Name of the binary property to save the file to',
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
				const waitFor = this.getNodeParameter('waitFor', i, '') as string;
				const creds = await this.getCredentials('browserlessApi');
				const baseUrl = (creds.url as string) || 'https://chrome.browserless.io';

				const requestBody: IDataObject = {
					url: targetUrl,
				};
				if (waitFor) {
					if (!isNaN(Number(waitFor))) {
						requestBody.waitForTimeout = Number(waitFor);
					} else {
						requestBody.waitForSelector = { selector: waitFor };
					}
				}

				if (operation === 'content') {
					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'browserlessApi',
						{
							method: 'POST',
							url: `${baseUrl}/content`,
							body: requestBody,
							json: false,
						},
					)) as string;

					returnData.push({
						json: {
							html: response,
							url: targetUrl,
							length: response.length,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'screenshot') {
					const fullPage = this.getNodeParameter('fullPage', i, true) as boolean;
					const dataPropertyName = this.getNodeParameter('dataPropertyName', i, 'data') as string;

					requestBody.options = {
						fullPage,
						type: 'png',
					};

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'browserlessApi',
						{
							method: 'POST',
							url: `${baseUrl}/screenshot`,
							body: requestBody,
							encoding: 'arraybuffer',
							json: false,
						},
					)) as ArrayBuffer;

					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(response),
						'screenshot.png',
						'image/png',
					);

					returnData.push({
						json: {
							success: true,
							url: targetUrl,
						},
						binary: {
							[dataPropertyName]: binaryData,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'pdf') {
					const dataPropertyName = this.getNodeParameter('dataPropertyName', i, 'data') as string;

					requestBody.options = {
						printBackground: true,
						format: 'A4',
					};

					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'browserlessApi',
						{
							method: 'POST',
							url: `${baseUrl}/pdf`,
							body: requestBody,
							encoding: 'arraybuffer',
							json: false,
						},
					)) as ArrayBuffer;

					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(response),
						'document.pdf',
						'application/pdf',
					);

					returnData.push({
						json: {
							success: true,
							url: targetUrl,
						},
						binary: {
							[dataPropertyName]: binaryData,
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
