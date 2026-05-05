import { Message, ChatMessage } from '../types/index.js';
import { scenarioStore } from './ScenarioStore.js';
import { appEvents } from './index.js';
import { TurnQueueManager } from '../services/turnQueue.js';
import { Character, Scenario } from '../types/index.js';

class ChatStore {
  private messages: Message[] = [];
  private isStreaming = false;
  private turnQueue: TurnQueueManager | null = null;

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

  initializeTurnQueue(scenario: Scenario, characters: Character[]): void {
    this.turnQueue = new TurnQueueManager(scenario, characters);
  }

  pauseAutoScenario(scenarioId: string): void {
    if (this.turnQueue) {
      this.turnQueue.pause();
    }
  }

  resumeAutoScenario(scenarioId: string): void {
    if (this.turnQueue) {
      this.turnQueue.resume();
    }
  }
}

export const chatStore = new ChatStore();
