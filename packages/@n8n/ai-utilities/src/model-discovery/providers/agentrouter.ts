import { makeBearerDataListing } from '../request';

/** Source: AgentRouter OpenAI-compatible models endpoint. */
export const listAgentRouterModels = makeBearerDataListing(
	'agentrouter',
	'https://agentrouter.org/v1',
);
