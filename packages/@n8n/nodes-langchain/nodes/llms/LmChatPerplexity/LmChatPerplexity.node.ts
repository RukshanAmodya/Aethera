import { ChatOpenAI, type ClientOptions } from '@langchain/openai';
import {
	getProxyAgent,
	makeN8nLlmFailedAttemptHandler,
	N8nLlmTracing,
	getConnectionHintNoticeField,
} from '@n8n/ai-utilities';
import {
	NodeConnectionTypes,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import type { OpenAICompatibleCredential } from '../../../types/types';
import { openAiFailedAttemptHandler } from '../../vendors/OpenAi/helpers/error-handling';

export class LmChatPerplexity implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Perplexity AI Model',
		name: 'lmChatPerplexity',
		icon: { light: 'file:perplexity.svg', dark: 'file:perplexity.dark.svg' },
		group: ['transform'],
		version: [1],
		description: 'Access Perplexity Sonar search and reasoning models with real-time web knowledge',
		defaults: {
			name: 'Perplexity AI Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.perplexity.ai',
					},
				],
			},
		},

		inputs: [],

		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'perplexityApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials?.url || "https://api.perplexity.ai" }}',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionTypes.AiChain, NodeConnectionTypes.AiAgent]),
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				description: 'The Perplexity model to use for completion with real-time search',
				options: [
					{
						name: 'Sonar (Fast Online Search)',
						value: 'sonar',
						description: 'Lightweight, fast model with real-time internet search grounded citations',
					},
					{
						name: 'Sonar Pro (Deep Online Search & Reasoning)',
						value: 'sonar-pro',
						description: 'Premier search model capable of complex follow-ups and deeper analysis',
					},
					{
						name: 'Sonar Reasoning (Search & Chain of Thought)',
						value: 'sonar-reasoning',
						description: 'Real-time search augmented with step-by-step reasoning',
					},
					{
						name: 'Sonar Reasoning Pro (High Intelligence Reasoning)',
						value: 'sonar-reasoning-pro',
						description: 'Most capable reasoning model for advanced research problems',
					},
				],
				default: 'sonar',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						default: -1,
						description: 'The maximum number of tokens to generate in the completion.',
						type: 'number',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.2,
						typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
						description: 'Controls randomness: Lowering results in more focused and deterministic answers.',
						type: 'number',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description: 'Penalizes new tokens based on their frequency in text so far.',
						type: 'number',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description: 'Penalizes tokens based on whether they appear in text so far.',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 0.9,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description: 'Nucleus sampling threshold.',
						type: 'number',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						default: 60000,
						description: 'Maximum amount of time a request is allowed to take in milliseconds',
						type: 'number',
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						default: 2,
						description: 'Maximum number of retries to attempt',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials<OpenAICompatibleCredential>('perplexityApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokens?: number;
			maxRetries?: number;
			temperature?: number;
			timeout?: number;
			topP?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
		};

		const timeout = options.timeout;
		const baseURL = credentials.url || 'https://api.perplexity.ai';

		const configuration: ClientOptions = {
			baseURL,
			fetchOptions: {
				dispatcher: getProxyAgent(baseURL, {
					headersTimeout: timeout,
					bodyTimeout: timeout,
				}),
			},
		};

		const model = new ChatOpenAI({
			apiKey: credentials.apiKey,
			model: modelName,
			...options,
			timeout,
			maxRetries: options.maxRetries ?? 2,
			configuration,
			callbacks: [new N8nLlmTracing(this)],
			onFailedAttempt: makeN8nLlmFailedAttemptHandler(this, openAiFailedAttemptHandler),
		});

		return {
			response: model,
		};
	}
}
