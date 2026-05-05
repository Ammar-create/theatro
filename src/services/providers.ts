import { 
  Provider, Model, ChatParams, StreamingChunk 
} from '../types/index.js';
import { getDB, initializeDefaults } from '../core/storage.js';

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
  // Characters (Pollinations - fast, capable)
  characterDefault: 'llama-scout',
  characterFallback: 'mistral',
  characterPremium: 'llama-4',
  
  // Controllers (Pollinations by default, Aqua if key provided)
  mainController: 'llama-scout',
  scenarioController: 'llama-scout', 
  creativeController: 'llama-scout',
  
  // Aqua Premium (when key provided)
  aquaMainController: 'grok-4.1-thinking',
  aquaScenarioController: 'grok-4.2',
  aquaCreativeController: 'grok',
  
  // Media (Pollinations always)
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
      
      if (!response.ok) {
        return this.getFallbackModels();
      }

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
      console.warn(`Failed to fetch models from ${this.provider.baseUrl}:`, err);
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
            // Skip malformed JSON lines
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
    throw new Error('Image generation not supported for this provider');
  }

  async generateVoice(text: string, voice: string = 'default'): Promise<string> {
    if (this.provider.type === 'pollinations') {
      const encodedText = encodeURIComponent(text);
      return `https://audio.pollinations.ai/tts/${encodedText}?voice=${voice}&seed=${Date.now()}`;
    }
    throw new Error('Voice generation not supported for this provider');
  }

  private getFallbackModels(): Model[] {
    // Pollinations models (with publishable key)
    const pollinationsModels: Model[] = [
      { 
        id: 'llama-scout', 
        name: 'Llama 4 Scout 17B', 
        providerId: this.provider.id, 
        contextWindow: 128000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'mistral', 
        name: 'Mistral Small 3.1', 
        providerId: this.provider.id, 
        contextWindow: 32000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'llama-4', 
        name: 'Llama 4 Maverick', 
        providerId: this.provider.id, 
        contextWindow: 256000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'gpt-5.4-nano', 
        name: 'GPT-5.4 Nano', 
        providerId: this.provider.id, 
        contextWindow: 32000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'zimage', 
        name: 'ZImage', 
        providerId: this.provider.id, 
        contextWindow: 0, 
        capabilities: ['image'] 
      },
      { 
        id: 'qwen3-tts-flash', 
        name: 'Qwen 3 TTS Flash', 
        providerId: this.provider.id, 
        contextWindow: 0, 
        capabilities: ['voice'] 
      },
      { 
        id: 'whisper-large-v3', 
        name: 'Whisper Large v3', 
        providerId: this.provider.id, 
        contextWindow: 0, 
        capabilities: ['voice'] 
      },
    ];

    // Aqua models (premium, requires user key)
    const aquaModels: Model[] = [
      { 
        id: 'grok-4.1-thinking', 
        name: 'Grok 4.1 Thinking', 
        providerId: this.provider.id, 
        contextWindow: 200000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'grok-4.2', 
        name: 'Grok 4.2', 
        providerId: this.provider.id, 
        contextWindow: 200000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'grok', 
        name: 'Grok 4 Fast', 
        providerId: this.provider.id, 
        contextWindow: 128000, 
        capabilities: ['chat'] 
      },
      { 
        id: 'llama-4', 
        name: 'Llama 4 Maverick', 
        providerId: this.provider.id, 
        contextWindow: 256000, 
        capabilities: ['chat'] 
      },
    ];

    // Custom provider - return sensible defaults
    const customModels: Model[] = [
      { 
        id: 'gpt-4', 
        name: 'GPT-4', 
        providerId: this.provider.id, 
        contextWindow: 8192, 
        capabilities: ['chat'] 
      },
    ];

    if (this.provider.type === 'pollinations') return pollinationsModels;
    if (this.provider.type === 'aqua') return aquaModels;
    if (this.provider.type === 'custom') return customModels;
    
    return pollinationsModels;
  }

  private inferContextWindow(modelId: string): number {
    if (modelId.includes('grok')) return 200000;
    if (modelId.includes('llama-4')) return 256000;
    if (modelId.includes('llama')) return 128000;
    if (modelId.includes('mistral')) return 32000;
    if (modelId.includes('grok')) return 200000;
    return 4096;
  }

  private inferCapabilities(modelId: string): ('chat' | 'image' | 'voice' | 'vision')[] {
    if (modelId.includes('zimage') || modelId.includes('dall')) return ['image'];
    if (modelId.includes('tts') || modelId.includes('whisper')) return ['voice'];
    if (modelId.includes('vision')) return ['chat', 'vision'];
    return ['chat'];
  }
}

export function createProviderAdapter(provider: Provider): ProviderAdapter {
  return new OpenAICompatibleAdapter(provider);
}

export async function getDefaultProvider(): Promise<Provider | undefined> {
  const db = await getDB();
  const tx = db.transaction('providers', 'readonly');
  const index = tx.store.index('by-default');
  const providers = await index.getAll(IDBKeyRange.only(1));
  return providers[0];
}

export async function getProvider(id: string): Promise<Provider | undefined> {
  const db = await getDB();
  return db.get('providers', id);
}

export async function getAllProviders(): Promise<Provider[]> {
  const db = await getDB();
  return db.getAll('providers');
}

export async function initializeProviders(): Promise<void> {
  const db = await getDB();
  const existing = await db.getAll('providers');
  if (existing.length > 0) return;

  // Provider P: Pollinations (with embedded publishable key)
  const pollinationsProvider: Provider = {
    id: 'pollinations-p',
    name: 'Pollinations',
    baseUrl: POLLINATIONS_BASE_URL,
    apiKey: POLLINATIONS_PUBLISHABLE_KEY,
    isDefault: true,
    type: 'pollinations'
  };
  await db.put('providers', pollinationsProvider);

  // Provider A: Aqua (placeholder for user key)
  const aquaProvider: Provider = {
    id: 'aqua-a',
    name: 'Aqua (Premium)',
    baseUrl: AQUA_BASE_URL,
    apiKey: '', // User must add
    isDefault: false,
    type: 'aqua'
  };
  await db.put('providers', aquaProvider);
}

export async function streamChat(
  params: ChatParams, 
  providerId: string
): Promise<AsyncGenerator<StreamingChunk>> {
  const provider = await getProvider(providerId);
  if (!provider) throw new Error(`Provider not found: ${providerId}`);
  const adapter = createProviderAdapter(provider);
  return adapter.streamChat(params);
}

export async function generateImage(
  prompt: string, 
  providerId: string = 'pollinations-p'
): Promise<string> {
  const provider = await getProvider(providerId);
  if (!provider) throw new Error(`Provider not found: ${providerId}`);
  const adapter = createProviderAdapter(provider);
  if (!adapter.generateImage) throw new Error('Image generation not supported');
  return adapter.generateImage(prompt);
}

export async function generateVoice(
  text: string, 
  voice?: string, 
  providerId: string = 'pollinations-p'
): Promise<string> {
  const provider = await getProvider(providerId);
  if (!provider) throw new Error(`Provider not found: ${providerId}`);
  const adapter = createProviderAdapter(provider);
  if (!adapter.generateVoice) throw new Error('Voice generation not supported');
  return adapter.generateVoice(text, voice);
}

// Rate limit tracking for client-side warning
export class RateLimitTracker {
  private callsThisHour = 0;
  private hourStart = Date.now();
  private readonly POLLINATIONS_LIMIT = 400; // 0.4 credits = ~400 calls for your tier

  recordCall(): void {
    const now = Date.now();
    if (now - this.hourStart > 3600000) {
      this.callsThisHour = 0;
      this.hourStart = now;
    }
    this.callsThisHour++;
  }

  getStatus(): { used: number; limit: number; percentage: number } {
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
