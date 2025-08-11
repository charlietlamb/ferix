import { openai } from '@ai-sdk/openai';
import { Agent } from '@convex-dev/agent';
import { components } from '../_generated/api';

export const baseAgent = new Agent(components.agent, {
  name: 'My Agent',
  chat: openai.chat('gpt-4o-mini'),
});
