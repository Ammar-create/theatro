import { Message, Character, Scenario } from '../types/index.js';
import { scenarioStore } from './ScenarioStore.js';
import { appEvents } from './appState.js';
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

    const { characterStore } = await import('./CharacterStore.js');
    const userChar = await characterStore.getUserCharacter();
    const userCharId = userChar?.id || this.currentScenario.characterIds[0];

    this.turnQueue.addToQueue({
      id: `user_${Date.now()}`,
      type: 'user',
      characterId: userCharId,
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