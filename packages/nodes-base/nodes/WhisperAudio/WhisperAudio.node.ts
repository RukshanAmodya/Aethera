import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class WhisperAudio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Whisper Audio Transcriber',
		name: 'whisperAudio',
		icon: { light: 'file:whisper.svg', dark: 'file:whisper.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Transcribe audio speech to text with Whisper (supports Groq & OpenAI APIs)',
		subtitle: '={{$parameter["provider"] + " - " + $parameter["model"]}}',
		defaults: {
			name: 'Whisper Audio Transcriber',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'groqApi',
				required: true,
				displayOptions: {
					show: {
						provider: ['groq'],
					},
				},
			},
			{
				name: 'openAiApi',
				required: true,
				displayOptions: {
					show: {
						provider: ['openAi'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'options',
				options: [
					{
						name: 'Groq (Ultra Fast Whisper)',
						value: 'groq',
						description: 'Ultra-fast low-cost Whisper transcription powered by Groq LPU',
					},
					{
						name: 'OpenAI Whisper',
						value: 'openAi',
						description: 'Official OpenAI Whisper API',
					},
				],
				default: 'groq',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'The name of the binary input property containing the audio file to transcribe',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				displayOptions: {
					show: {
						provider: ['groq'],
					},
				},
				options: [
					{
						name: 'Whisper Large v3 (Best Accuracy)',
						value: 'whisper-large-v3',
					},
					{
						name: 'Whisper Large v3 Turbo (Faster)',
						value: 'whisper-large-v3-turbo',
					},
				],
				default: 'whisper-large-v3-turbo',
			},
			{
				displayName: 'Model',
				name: 'openAiModel',
				type: 'options',
				displayOptions: {
					show: {
						provider: ['openAi'],
					},
				},
				options: [
					{
						name: 'Whisper 1',
						value: 'whisper-1',
					},
				],
				default: 'whisper-1',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
					},
					{
						name: 'Plain Text',
						value: 'text',
					},
					{
						name: 'Verbose JSON (With Timestamps)',
						value: 'verbose_json',
					},
					{
						name: 'SRT Subtitles',
						value: 'srt',
					},
					{
						name: 'VTT Subtitles',
						value: 'vtt',
					},
				],
				default: 'json',
			},
			{
				displayName: 'Language Code (Optional)',
				name: 'language',
				type: 'string',
				default: '',
				description: 'The language of the input audio in ISO-639-1 format (e.g. "en", "si", "es"). Improves accuracy.',
			},
			{
				displayName: 'Prompt (Optional)',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Optional text guide to guide the model style or continue previous audio segment',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const provider = this.getNodeParameter('provider', i) as 'groq' | 'openAi';
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const model =
					provider === 'groq'
						? (this.getNodeParameter('model', i) as string)
						: (this.getNodeParameter('openAiModel', i) as string);
				const responseFormat = this.getNodeParameter('responseFormat', i) as string;
				const language = this.getNodeParameter('language', i, '') as string;
				const prompt = this.getNodeParameter('prompt', i, '') as string;

				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
				const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

				const formData: IDataObject = {
					file: {
						value: buffer,
						options: {
							filename: binaryData.fileName || 'audio.mp3',
							contentType: binaryData.mimeType || 'audio/mpeg',
						},
					},
					model,
					response_format: responseFormat,
				};

				if (language) formData.language = language;
				if (prompt) formData.prompt = prompt;

				let response: unknown;
				if (provider === 'groq') {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'groqApi', {
						method: 'POST',
						url: 'https://api.groq.com/openai/v1/audio/transcriptions',
						body: formData,
					});
				} else {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'openAiApi', {
						method: 'POST',
						url: 'https://api.openai.com/v1/audio/transcriptions',
						body: formData,
					});
				}

				let resultJson: IDataObject;
				if (typeof response === 'string') {
					resultJson = { text: response };
				} else if (typeof response === 'object' && response !== null) {
					resultJson = response as IDataObject;
				} else {
					resultJson = { text: String(response) };
				}

				returnData.push({
					json: resultJson,
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
