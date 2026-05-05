import { 
  Provider, Model, ChatParams, StreamingChunk 
} from '../types/index.js';
import { getDB } from '../core/storage.js';

export interface ProviderAdapter {
  readonly provider: Provider;
  listModels(): Promise<Model[]>;
  streamChat(params: ChatParams): AsyncGenerator<StreamingChunk>;
  generateImage?(prompt: string): Promise<string>;
  generateVoice?(text: string, voice?: string): Promise<string>;
}

// ===== EMBEDDED PROVIDER CONFIGURATION =====
export const POLLINATIONS_PUBLISHABLE_KEY = 'pk_LUy70Tu8OwLI1HrU';
export const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/v1';
export const AQUA_BASE_URL = 'https://api.aquadevs.com/v1';

// Default models by category
export const DEFAULT_MODELS = {
  characterDefault: 'llama-scout',
  characterFallback: 'mistral',
  characterPremium: 'llama-4',
  mainController: 'llama-scout',
  scenarioController: 'llama-scout',
  creativeController: 'llama-scout',
  aquaMainController: 'grok-4.1-thinking',
  aquaScenarioController: 'grok-4.2',
  aquaCreativeController: 'grok',
  image: 'zimage',
  tts: 'qwen3-tts-flash',
  stt: 'whisper-large-v3'
};

class OpenAICompatibleAdapter implements ProviderAdapter {
  constructor(public readonly provider: Provider) {}

  async listModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.provider.baseUrl}/models`, {
        headers: this.provider.apiKey 
          ? { 'Authorization': `Bearer ${this.provider.apiKey}` }
          : {}
      });
      
      if (!response.ok) return this.getFallbackModels();

      const data = await response.json();
      const models = data.data || data.models || [];
      
      return models.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        providerId: this.provider.id,
        contextWindow: this.inferContextWindow(m.id),
        capabilities: this.inferCapabilities(m.id)
      }));
    } catch (err) {
      console.warn(`Failed to fetch models:`, err);
      return this.getFallbackModels();
    }
  }

  async *streamChat(params: ChatParams): AsyncGenerator<StreamingChunk> {
    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.provider.apiKey && { 'Authorization': `Bearer ${this.provider.apiKey}` })
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.8,
        max_tokens: params.maxTokens,
        stream: true,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat API error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '' || trimmed === 'data: [DONE]') continue;
          
          const data = trimmed.replace(/^data: /, '');
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta;
            
            if (delta?.content) {
              yield { content: delta.content, done: false };
            }
            
            if (chunk.choices?.[0]?.finish_reason) {
              yield { content: '', done: true, usage: chunk.usage };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (this.provider.type === 'pollinations') {
      const encodedPrompt = encodeURIComponent(prompt);
      return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;
    }
    throw new Error('Image generation not supported');
  }

  async generateVoice(text: string, voice: string = 'default'): Promise<string> {
    if (this.provider.type === 'pollinations') {
      const encodedText = encodeURIComponent(text);
      return `https://audio.pollinations.ai/tts/${encodedText}?voice=${voice}&seed=${Date.now()}`;
    }
    throw new Error('Voice generation not supported');
  }

  private getFallbackModels(): Model[] {
    const pollinations: Model[] = [
      { id: 'llama-scout', name: 'Llama 4 Scout 17B', providerId: this.provider.id, contextWindow: 128000, capabilities: ['chat'] },
      { id: 'mistral', name: 'Mistral Small 3.1', providerId: this.provider.id, contextWindow: 32000, capabilities: ['chat'] },
      { id: 'llama-4', name: 'Llama 4 Maverick', providerId: this.provider.id, contextWindow: 256000, capabilities: ['chat'] },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', providerId: this.provider.id, contextWindow: 32000, capabilities: ['chat'] },
      { id: 'zimage', name: 'ZImage', providerId: this.provider.id, contextWindow: 0, capabilities: ['image'] },
      { id: 'qwen3-tts-flash', name: 'Qwen 3 TTS Flash', providerId: this.provider.id, contextWindow: 0, capabilities: ['voice'] },
      { id: 'whisper-large-v3', name: 'Whisper Large v3', providerId: this.provider.id, contextWindow: 0, capabilities: ['voice'] },
    ];

    const aqua: Model[] = [
      { id: 'grok-4.1-thinking', name: 'Grok 4.1 Thinking', providerId: this.provider.id, contextWindow: 200000, capabilities: ['chat'] },
      { id: 'grok-4.2', name: 'Grok 4.2', providerId: this.provider.id, contextWindow: 200000, capabilities: ['chat'] },
      { id: 'grok', name: 'Grok 4 Fast', providerId: this.provider.id, contextWindow: 128000, capabilities: ['chat'] },
      { id: 'llama-4', name: 'Llama 4 Maverick', providerId: this.provider.id, contextWindow: 256000, capabilities: ['chat'] },
    ];

    if (this.provider.type === 'pollinations') return pollinations;
    if (this.provider.type === 'aqua') return aqua;
    return [{ id: 'gpt-4', name: 'GPT-4', providerId: this.provider.id, contextWindow: 8192, capabilities: ['chat'] }];
  }

  private inferContextWindow(modelId: string): number {
    if (modelId.includes('grok')) return 200000;
    if (modelId.includes('llama-4')) return 256000;
    if (modelId.includes('lincludes('mistral')) return 32000;
    return 4096;
  }

  private inferCapabilities(modelId: string): ('chat' | 'image' | 'voice' | 'vigetProvider(id: string): Promise<Provider | undefined> {
  const db = await getDB();
  return db.get('providers', id);
}

export async function getAllProviders(): Promise<Provider[]> {
  const db = await getDB();
  return db.getAll('providers');
}

export async function streamChat(params: ChatParams, providerId: string): Promise<AsyncGenerator<StreamingChunk>> {
  const provider = await getProvider(providerId);
  if (!provider) throw new Error(`Provider not found: const adapter = cre async function generateImage(prompt: string, providerId: string = 'pollinations-p'): Promise<string> {
  const provider = await getProvider(providerId);
  if (!provider) throw new Error(`Provider not found: ${providerId}`);
  const adapter = createProviderAdapter(provider);
  if (!adapter.generateImage) throw new Error('Image generation not supported');
  return adapter.generateImage(prompt)tProvider(providerId throw new Error(`PrproviderId}`);
  const adapter = createon initializeProviders(): Promise<void> t getDB();
  const existing = await db.getAll('providers');
  if (existing.length > 0) return;

  const pollinations: Provider = {
    id: 'pollinations-p',
    name: 'Pollinl: POLLINATIONS_BASEOLLINATIONS_PUBLISHABLE_KEY,
    isDefa};
  await db.put('ions);

  const aqua: Provider = {
    id: 'aqua-a',
    name: 'Aqua (Premium)',
    baseUrl: AQUA_BASE_URL,
    apiKey: '',
    isDefault: false,
    type: 'aqua'
  };
  await db.put('providers', aqua);
}

export async function getDefaultProvider(): Promise<Provider | undefined> {
  const providers = await getAllProviders();
  return providers.find(p => p.isDefault) || providers[0];
}

export class RateLimitTracker {
  private callsThisHour = 0;
  private hourStart = Date.now();
  private readonly POLLINATIONS_LIMIT = 400;

  recordCall(): void {
    const now = Date.now();
    if (now - this.hourStart > 3600000) {
      this.callsThisHour = 0;
      this.hourStart = now;
    }
    this.callsThisHour++;
  }

  getStatus() {
    return {
      used: this.callsThisHour,
      limit: this.POLLINATIONS_LIMIT,
      percentage: (this.callsThisHour / this.POLLINATIONS_LIMIT) * 100
    };
  }

  shouldWarn(): boolean {
    return this.callsThisHour > this.POLLINATIONS_LIMIT * 0.8;
  }
}

export const rateTracker = new RateLimitTracker();
