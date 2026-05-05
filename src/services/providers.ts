import { 
  Provider, Model, ChatParams, StreamingChunk 
} from '../types/index.js';

export interface ProviderAdapter {
  readonly provider: Provider;
  listModels(): Promise<Model[]>;
  streamChat(params: ChatParams): AsyncGenerator<StreamingChunk>;
  generateImage?(prompt: string): Promise<string>;
  generateVoice?(text: string, voice?: string): Promise<string>;
}

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
        name: m.id,
        providerId: this.provider.id,
        contextWindow: this.inferContextWindow(m.id),
        capabilities: this.inferCapabilities(m.id)
      }));
    } catch {
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
      throw new Error(`Chat API error: ${response.status}`);
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
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          
          const data = line.replace(/^data: /, '');
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
    const pollinationsModels: Model[] = [
      { id: 'llama-scout', name: 'Llama 4 Scout 17B', providerId: this.provider.id, contextWindow: 128000, capabilities: ['chat'] },
      { id: 'mistral', name: 'Mistral Small 3.1', providerId: this.provider.id, contextWindow: 32000, capabilities: ['chat'] },
      { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', providerId: this.provider.id, contextWindow: 32000, capabilities: ['chat'] },
      { id: 'zimage', name: 'ZImage', providerId: this.provider.id, contextWindow: 0, capabilities: ['image'] },
    ];

    const aquaModels: Model[] = [
      { id: 'grok-4.1-thinking', name: 'Grok 4.1 Thinking', providerId: this.provider.id, contextWindow: 200000, capabilities: ['chat'] },
      { id: 'grok-4.2', name: 'Grok 4.2', providerId: this.provider.id, contextWindow: 200000, capabilities: ['chat'] },
      { id: 'grok', name: 'Grok 4 Fast', providerId: this.provider.id, contextWindow: 128000, capabilities: ['chat'] },
      { id: 'llama-4', name: 'Llama 4 Maverick', providerId: this.provider.id, contextWindow: 256000, capabilities: ['chat'] },
    ];

    if (this.provider.type === 'pollinations') return pollinationsModels;
    if (this.provider.type === 'aqua') return aquaModels;
    
    return [
      { id: 'gpt-4', name: 'GPT-4', providerId: this.provider.id, contextWindow: 8192, capabilities: ['chat'] },
    ];
  }

  private inferContextWindow(modelId: string): number {
    if (modelId.includes('grok')) return 200000;
    if (modelId.includes('llama-4')) return 256000;
    if (modelId.includes('llama')) return 128000;
    if (modelId.includes('mistral')) return 32000;
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
