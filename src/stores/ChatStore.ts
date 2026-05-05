import { createProviderAdapter } from '../services/providers.js';
import type { Character, Message, Scenario, StreamingChunk } from '../types/index.js';

interface ChatContext {
  messages: Message[];
  character: Character;
  scenario: Scenario;
  otherCharacters: Character[];
}

export class ChatStore {
  private streamingMessages = new Map<string, string>();

  async generateResponse(
    context: ChatContext,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<void> {
    const adapter = createProviderAdapter({
      id: context.character.providerId,
      name: 'Provider',
      baseUrl: 'https://gen.pollinations.ai/v1',
      isDefault: true,
      type: 'pollinations'
    });

    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context);

    const stream = adapter.streamChat({
      model: context.character.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      maxTokens: 500,
      stream: true
    });

    for await (const chunk of stream) {
      onChunk(chunk);
    }
  }

  private buildSystemPrompt(ctx: ChatContext): string {
    return `You are ${ctx.character.name}.

PERSONALITY: ${ctx.character.personality}

APPEARANCE: ${ctx.character.appearance || 'Not specified'}

SPEECH PATTERNS: ${ctx.character.speechPatterns?.join(', ') || 'Natural, conversational'}

You are participating in a roleplay scenario called "${ctx.scenario.name}".
${ctx.scenario.lore}

OTHER CHARACTERS:
${ctx.otherCharacters.map(c => `- ${c.name}: ${c.personality.slice(0, 100)}...`).join('\n')}

RULES:
1. Stay in character at all times
2. Use **asterisks** for actions and descriptions
3. Use "quotation marks" for dialogue
4. Be reactive to the conversation
5. Show emotion through your writing
6. NEVER break character or mention you are an AI`;
  }

  private buildUserPrompt(ctx: ChatContext): string {
    const recentMessages = ctx.messages.slice(-10);
    
    return `Recent conversation:
${recentMessages.map(m => {
  const prefix = m.characterId ? `[Character]` : '[Narrator]';
  return `${prefix}: ${m.content}`;
}).join('\n')}

Respond as ${ctx.character.name}:`;
  }

  getStreamingContent(messageId: string): string | undefined {
    return this.streamingMessages.get(messageId);
  }

  setStreamingContent(messageId: string, content: string): void {
    this.streamingMessages.set(messageId, content);
  }

  clearStreaming(messageId: string): void {
    this.streamingMessages.delete(messageId);
  }
}
