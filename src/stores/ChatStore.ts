import { Message, ChatMessage, Character, Scenario } from '../types/index.js';
import { scenarioStore } from './ScenarioStore.js';
import { appEvents, appState } from './index.js';
import { TurnQueueManager } from '../services/turnQueue.js';
import { getMessagesForScenario, saveMessage } from '../core/storage.js';

class ChatStore {
  private messages: Message[] = [];
  private isStreaming = false;
  private turnQueue: TurnQueueManager | null = null;
  private currentScenario: Scenario | null = null;

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

  // ===== TURN QUEUE & AUTO-SCENARIO =====

  /** Initialize the turn queue for a newly activated scenario */
  initializeTurnQueue(scenario: Scenario, characters: Character[]): void {
    this.currentScenario = scenario;
    this.turnQueue = new TurnQueueManager(scenario, characters);

    // If auto-scenario was enabled, start processing after a short delay
    if (scenario.settings.autoScenario) {
      setTimeout(() => this.turnQueue?.resume(), 800);
    }

    appEvents.emit('turn-queue:initialized', { scenarioId: scenario.id });
  }

  /** Pause the auto-scenario turn queue for a given scenario */
  pauseAutoScenario(scenarioId: string): void {
    if (this.currentScenario?.id === scenarioId && this.turnQueue) {
      this.turnQueue.pause();
      appEvents.emit('auto-scenario:paused', { scenarioId });
    }
  }

  /** Toggle auto-scenario on/off for the current scenario */
  toggleAutoScenario(): void {
    if (!this.currentScenario) {
      appEvents.emit('toast', { message: 'No active scenario', type: 'warning' });
      return;
    }

    const newState = !this.currentScenario.settings.autoScenario;

    scenarioStore.updateSettings(this.currentScenario.id, {
      autoScenario: newState
    }).then(updated => {
      if (updated) {
        this.currentScenario = updated;
        if (newState) {
          this.turnQueue?.resume();
          appEvents.emit('auto-scenario:started', { scenarioId: updated.id });
        } else {
          this.turnQueue?.pause();
          appEvents.emit('auto-scenario:paused', { scenarioId: updated.id });
        }
        appEvents.emit('toast', {
          message: `Auto-scenario ${newState ? 'ON' : 'OFF'}`,
          type: 'info'
        });
      }
    });
  }

  // ===== MESSAGE SENDING =====

  /** Send a message from the user's character into the active turn queue */
  async sendUserMessage(
    content: string,
    dialogue: string,
    actions: string[]
  ): Promise<void> {
    if (!this.currentScenario || !this.turnQueue) {
      appEvents.emit('toast', { message: 'No active scenario', type: 'error' });
      return;
    }

    // Find the user character in this scenario
    const userCharId = Array.from(this.currentScenario.characterIds).find(cid => {
      // characterStore.get lives in CharacterStore, imported via scenarioStore context
      const characters = this.currentScenario?.characterIds || [];
      return false; // Will resolve from turnQueue's character lookup
    });

    // Push into turn queue — the TurnQueueManager will create the message
    this.turnQueue.addToQueue({
      id: `user_${Date.now()}`,
      type: 'user',
      characterId: this.currentScenario.characterIds[0], // Use first character as fallback
      content,
      actions,
      dialogue,
      timestamp: Date.now()
    });

    appEvents.emit('message:sent', { content, dialogue, actions });
  }

  clear(): void {
    this.messages = [];
    this.turnQueue?.clear();
    this.turnQueue = null;
    this.currentScenario = null;
  }
}

export const chatStore = new ChatStore();