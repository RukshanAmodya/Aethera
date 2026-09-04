import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class FalAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'fal.ai',
		name: 'falAi',
		icon: { light: 'file:falai.svg', dark: 'file:falai.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate cutting-edge AI images and media (Flux, SDXL) with fal.ai fast inference',
		subtitle: '={{$parameter["modelId"]}}',
		defaults: {
			name: 'fal.ai',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'falAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'modelId',
				type: 'options',
				options: [
					{
						name: 'Flux Dev (High Quality)',
						value: 'fal-ai/flux/dev',
						description: '12B parameter high fidelity text-to-image model',
					},
					{
						name: 'Flux Schnell (Super Fast 4-Step)',
						value: 'fal-ai/flux/schnell',
						description: 'Ultra fast 4-step generation for high throughput',
					},
					{
						name: 'Flux Pro (Commercial Flagship)',
						value: 'fal-ai/flux-pro',
						description: 'Highest quality commercial Flux model',
					},
					{
						name: 'Stable Diffusion XL (Lightning)',
						value: 'fal-ai/fast-sdxl',
						description: 'Sub-second SDXL image generation',
					},
					{
						name: 'Custom fal.ai Endpoint',
						value: 'custom',
						description: 'Use any fal.ai model ID',
					},
				],
				default: 'fal-ai/flux/schnell',
				description: 'The fal.ai model to run',
			},
			{
				displayName: 'Custom Model ID',
				name: 'customModelId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						modelId: ['custom'],
					},
				},
				description: 'e.g. fal-ai/kling-video/v1/standard/text-to-video',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'Text description of the image to generate',
			},
			{
				displayName: 'Image Size',
				name: 'imageSize',
				type: 'options',
				options: [
					{
						name: 'Square HD (1024x1024)',
						value: 'square_hd',
					},
					{
						name: 'Landscape 16:9',
						value: 'landscape_16_9',
					},
					{
						name: 'Portrait 16:9',
						value: 'portrait_16_9',
					},
					{
						name: 'Landscape 4:3',
						value: 'landscape_4_3',
					},
					{
						name: 'Portrait 4:3',
						value: 'portrait_4_3',
					},
				],
				default: 'landscape_16_9',
			},
			{
				displayName: 'Number of Inference Steps',
				name: 'numInferenceSteps',
				type: 'number',
				default: 4,
				description: 'Number of denoising steps (4 for Schnell, 28-50 for Dev)',
			},
			{
				displayName: 'Guidance Scale',
				name: 'guidanceScale',
				type: 'number',
				default: 3.5,
				description: 'Classifier-free guidance scale',
			},
			{
				displayName: 'Download Binary Image',
				name: 'downloadBinary',
				type: 'boolean',
				default: true,
				description: 'Whether to download generated image as a binary output in addition to returning the URL',
			},
			{
				displayName: 'Output Field Name',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						downloadBinary: [true],
					},
				},
				description: 'Name of the binary property to save the generated image to',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const modelIdChoice = this.getNodeParameter('modelId', i) as string;
				const modelId =
					modelIdChoice === 'custom'
						? (this.getNodeParameter('customModelId', i) as string)
						: modelIdChoice;
				const prompt = this.getNodeParameter('prompt', i) as string;
				const imageSize = this.getNodeParameter('imageSize', i) as string;
				const numInferenceSteps = this.getNodeParameter('numInferenceSteps', i) as number;
				const guidanceScale = this.getNodeParameter('guidanceScale', i) as number;
				const downloadBinary = this.getNodeParameter('downloadBinary', i) as boolean;
				const dataPropertyName = this.getNodeParameter('dataPropertyName', i, 'data') as string;

				const body: IDataObject = {
					prompt,
					image_size: imageSize,
					num_inference_steps: numInferenceSteps,
					guidance_scale: guidanceScale,
					num_images: 1,
					enable_safety_checker: true,
				};

				const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'falAiApi', {
					method: 'POST',
					url: `https://fal.run/${modelId}`,
					body,
					json: true,
				})) as {
					images?: Array<{ url: string; content_type?: string; width?: number; height?: number }>;
					seed?: number;
					timings?: IDataObject;
				};

				const firstImage = response.images?.[0];
				const resultJson: IDataObject = {
					...response,
					imageUrl: firstImage?.url || null,
					prompt,
					model: modelId,
				};

				const item: INodeExecutionData = {
					json: resultJson,
					pairedItem: { item: i },
				};

				if (downloadBinary && firstImage?.url) {
					const imageBuffer = (await this.helpers.httpRequest({
						method: 'GET',
						url: firstImage.url,
						encoding: 'arraybuffer',
					})) as ArrayBuffer;

					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(imageBuffer),
						'generated_image.jpg',
						firstImage.content_type || 'image/jpeg',
					);

					item.binary = {
						[dataPropertyName]: binaryData,
					};
				}

				returnData.push(item);
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
