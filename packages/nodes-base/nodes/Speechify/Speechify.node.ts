import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Speechify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Speechify',
		name: 'speechify',
		icon: { light: 'file:speechify.svg', dark: 'file:speechify.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Natural AI speech and voice synthesis using Speechify',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'Speechify',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'speechifyApi',
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
				displayName: 'Text / SSML',
				name: 'input',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'The plain text or SSML markup to synthesize',
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
				default: 'george',
				required: true,
				description: 'The ID of the Speechify voice (e.g. george, cliff, emma)',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
			},
			{
				displayName: 'Audio Format',
				name: 'audioFormat',
				type: 'options',
				options: [
					{
						name: 'MP3',
						value: 'mp3',
					},
					{
						name: 'WAV',
						value: 'wav',
					},
					{
						name: 'OGG',
						value: 'ogg',
					},
				],
				default: 'mp3',
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
							'speechifyApi',
							{
								method: 'GET',
								url: 'https://api.sws.speechify.com/v1/voices',
								json: true,
							},
						);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(response as IDataObject[]),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
					} else if (operation === 'textToSpeech') {
						const input = this.getNodeParameter('input', i) as string;
						const voiceId = this.getNodeParameter('voiceId', i) as string;
						const audioFormat = this.getNodeParameter('audioFormat', i) as string;
						const dataPropertyName = this.getNodeParameter('dataPropertyName', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'speechifyApi',
							{
								method: 'POST',
								url: 'https://api.sws.speechify.com/v1/audio/speech',
								body: {
									input,
									voice_id: voiceId,
									audio_format: audioFormat,
								},
								json: true,
							},
						);

						let audioBuffer: Buffer;
						if (response.audio_data) {
							audioBuffer = Buffer.from(response.audio_data as string, 'base64');
						} else {
							audioBuffer = Buffer.from([]);
						}

						const mimeType = audioFormat === 'wav' ? 'audio/wav' : audioFormat === 'ogg' ? 'audio/ogg' : 'audio/mpeg';

						const binaryData = await this.helpers.prepareBinaryData(
							audioBuffer,
							`speech.${audioFormat}`,
							mimeType,
						);

						const item: INodeExecutionData = {
							json: {
								success: true,
								voiceId,
								audioFormat,
								inputLength: input.length,
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
