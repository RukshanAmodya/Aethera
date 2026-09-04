import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Replicate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Replicate',
		name: 'replicate',
		icon: { light: 'file:replicate.svg', dark: 'file:replicate.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Run thousands of open-source AI models in the cloud with Replicate',
		subtitle: '={{$parameter["model"]}}',
		defaults: {
			name: 'Replicate',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'replicateApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model (owner/model-name or owner/model-name:version)',
				name: 'model',
				type: 'string',
				default: 'black-forest-labs/flux-schnell',
				required: true,
				description: 'The model to run, e.g. "black-forest-labs/flux-schnell" or "meta/meta-llama-3-70b-instruct"',
			},
			{
				displayName: 'Input (JSON)',
				name: 'inputJson',
				type: 'json',
				default: '{\n  "prompt": "a futuristic neon city at night"\n}',
				required: true,
				description: 'The input parameters JSON required by the specific model',
			},
			{
				displayName: 'Wait for Prediction to Complete',
				name: 'waitForOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to poll and wait until the model finishes prediction before continuing workflow',
			},
			{
				displayName: 'Max Wait Time (Seconds)',
				name: 'maxWaitSeconds',
				type: 'number',
				default: 120,
				displayOptions: {
					show: {
						waitForOutput: [true],
					},
				},
				description: 'Maximum time to poll before timing out',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const model = this.getNodeParameter('model', i) as string;
				const inputJson = this.getNodeParameter('inputJson', i);
				const waitForOutput = this.getNodeParameter('waitForOutput', i) as boolean;
				const maxWaitSeconds = this.getNodeParameter('maxWaitSeconds', i, 120) as number;

				let inputObj: IDataObject = {};
				if (typeof inputJson === 'string') {
					inputObj = JSON.parse(inputJson) as IDataObject;
				} else if (typeof inputJson === 'object' && inputJson !== null) {
					inputObj = inputJson as IDataObject;
				}

				// Post prediction
				let postUrl = `https://api.replicate.com/v1/models/${model}/predictions`;
				let postBody: IDataObject = { input: inputObj };

				if (model.includes(':')) {
					const [mName, version] = model.split(':');
					postUrl = 'https://api.replicate.com/v1/predictions';
					postBody = { version, input: inputObj };
				}

				let prediction = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'replicateApi',
					{
						method: 'POST',
						url: postUrl,
						body: postBody,
						json: true,
					},
				)) as { id: string; status: string; output?: unknown; error?: string; urls?: { get: string } };

				if (waitForOutput && prediction.status !== 'succeeded' && prediction.status !== 'failed') {
					const startTime = Date.now();
					while (
						prediction.status !== 'succeeded' &&
						prediction.status !== 'failed' &&
						prediction.status !== 'canceled' &&
						(Date.now() - startTime) / 1000 < maxWaitSeconds
					) {
						await new Promise((resolve) => setTimeout(resolve, 2000));
						prediction = (await this.helpers.httpRequestWithAuthentication.call(
							this,
							'replicateApi',
							{
								method: 'GET',
								url: `https://api.replicate.com/v1/predictions/${prediction.id}`,
								json: true,
							},
						)) as typeof prediction;
					}
				}

				returnData.push({
					json: prediction as unknown as IDataObject,
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
