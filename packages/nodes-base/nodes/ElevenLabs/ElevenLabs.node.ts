import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class ElevenLabs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ElevenLabs',
		name: 'elevenLabs',
		icon: { light: 'file:elevenlabs.svg', dark: 'file:elevenlabs.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Generate high quality AI voice and speech audio using ElevenLabs',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'ElevenLabs',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'elevenLabsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Audio / Voice',
						value: 'audio',
					},
				],
				default: 'audio',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['audio'],
					},
				},
				options: [
					{
						name: 'Text to Speech',
						value: 'textToSpeech',
						description: 'Convert text into natural audio speech',
						action: 'Convert text to speech',
					},
					{
						name: 'List Voices',
						value: 'listVoices',
						description: 'Retrieve list of available voices',
						action: 'List available voices',
					},
				],
				default: 'textToSpeech',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'The text that will be converted into speech audio',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
			},
			{
				displayName: 'Voice ID',
				name: 'voiceId',
				type: 'string',
				default: '21m00Tcm4TlvDq8ikWAM',
				required: true,
				description: 'The ID of the voice to generate audio with (default: Rachel)',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
			},
			{
				displayName: 'Model ID',
				name: 'modelId',
				type: 'options',
				options: [
					{
						name: 'Eleven Multilingual v2',
						value: 'eleven_multilingual_v2',
					},
					{
						name: 'Eleven Turbo v2.5',
						value: 'eleven_turbo_v2_5',
					},
					{
						name: 'Eleven Flash v2.5',
						value: 'eleven_flash_v2_5',
					},
					{
						name: 'Eleven Monolingual v1',
						value: 'eleven_monolingual_v1',
					},
				],
				default: 'eleven_multilingual_v2',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
			},
			{
				displayName: 'Put Output in Field',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'The name of the binary property to which to write the audio file',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i);
				const operation = this.getNodeParameter('operation', i);

				if (resource === 'audio') {
					if (operation === 'listVoices') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'elevenLabsApi',
							{
								method: 'GET',
								url: 'https://api.elevenlabs.io/v1/voices',
								json: true,
							},
						);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response.voices as IDataObject[]),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'textToSpeech') {
						const text = this.getNodeParameter('text', i) as string;
						const voiceId = this.getNodeParameter('voiceId', i) as string;
						const modelId = this.getNodeParameter('modelId', i) as string;
						const dataPropertyName = this.getNodeParameter('dataPropertyName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'elevenLabsApi',
							{
								method: 'POST',
								url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
								body: {
									text,
									model_id: modelId,
								},
								encoding: 'arraybuffer',
								json: false,
							},
						);

						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response as ArrayBuffer),
							'speech.mp3',
							'audio/mpeg',
						);

						const item: INodeExecutionData = {
							json: {
								success: true,
								voiceId,
								modelId,
								textLength: text.length,
							},
							binary: {
								[dataPropertyName]: binaryData,
							},
							pairedItem: { item: i },
						};
						returnData.push(item);
					}
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
