import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { extractDataFromPDF } from '../../utils/binary';

export class SmartPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Smart PDF Toolkit',
		name: 'smartPdf',
		icon: 'file:smartpdf.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract text, inspect metadata, and analyze PDF documents with built-in engine',
		subtitle: '={{$parameter["operation"]}}',
		defaults: {
			name: 'Smart PDF Toolkit',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Extract Text & Metadata',
						value: 'extractText',
						description: 'Extract full textual contents, page counts, and metadata from PDF',
						action: 'Extract text and metadata from PDF',
					},
					{
						name: 'Inspect Page Count',
						value: 'pageCount',
						description: 'Quickly get the number of pages in the PDF',
						action: 'Get page count',
					},
				],
				default: 'extractText',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the PDF file',
			},
			{
				displayName: 'Join Pages into Single Text',
				name: 'joinPages',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['extractText'],
					},
				},
				description: 'Whether to join all page contents into one continuous string or return an array of pages',
			},
			{
				displayName: 'Max Pages to Process',
				name: 'maxPages',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['extractText'],
					},
				},
				description: 'Maximum number of pages to read (0 for all pages)',
			},
			{
				displayName: 'Password (If Encrypted)',
				name: 'password',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Password to decrypt the PDF file if password-protected',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i);
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const password = this.getNodeParameter('password', i, '') as string;

				if (operation === 'extractText') {
					const joinPages = this.getNodeParameter('joinPages', i, true) as boolean;
					const maxPages = this.getNodeParameter('maxPages', i, 0) as number;

					const pdfData = await extractDataFromPDF.call(
						this,
						binaryPropertyName,
						password || undefined,
						maxPages,
						joinPages,
						i,
					);

					returnData.push({
						json: pdfData as unknown as IDataObject,
						binary: items[i].binary,
						pairedItem: { item: i },
					});
				} else if (operation === 'pageCount') {
					const pdfData = await extractDataFromPDF.call(
						this,
						binaryPropertyName,
						password || undefined,
						1,
						false,
						i,
					);

					returnData.push({
						json: {
							pageCount: pdfData.numpages,
							info: pdfData.info,
						},
						binary: items[i].binary,
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
