import { Message, ChatMessage } from '../types/index.js';
import { scenarioStore } from './ScenarioStore.js';
import { appEvents } from './index.js';

class ChatStore {
  private messages: Message[] = [];
  private isStreaming = false;

  async loadMessages(scenarioId: string): Promise<void> {
    this.messages = await scenarioStore.getMessages(scenarioId);
    appEvents.emit('chat:messages-loaded', this.messages);
  }

  getMessages(): Message[] {
    return this.messages;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    appEvents.emit('chat:message-added', message);
  }

  updateStreamingMessage(id: string, chunk: string): void {
    const msg = this.messages.find(m => m.id === id);
    if (msg) {
      msg.content += chunk;
      appEvents.emit('chat:message-updated', msg);
    }
  }

  setStreaming(streaming: boolean): void {
    this.isStreaming = streaming;
    appEvents.emit('chat:streaming-status', streaming);
  }

  getStreamingStatus(): boolean {
    return this.isStreaming;
  }

  clear(): void {
    this.messages = [];
  }
}

export const chatStore = new ChatStore();
