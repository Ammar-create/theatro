// ===== CHAT STORE - Message Management =====
import { 
  getMessagesForScenario, 
  saveMessage, 
  getScenario,
  saveScenario,
  getRelationshipMatrix,
  saveRelationshipMatrix
} from '../core/storage.js';
import { Message, Scenario, Character, TurnQueueItem } from '../types/index.js';
import { appEvents } from './index.js';
import { characterStore } from './CharacterStore.js';
import { TurnQueueManager } from '../services/turnQueue.js';

class ChatStore {
  private messages: Map<string, Message[]> = new Map(); // scenarioId -> messages
  private turnQueues: Map<string, TurnQueueManager> = new Map();
  private activeScenarioId: string | null = null;

  async getMessages(scenarioId: string, limit = 100): Promise<Message[]> {
    if (!this.messages.has(scenarioId)) {
      const msgs = await getMessagesForScenario(scenarioId, limit);
      this.messages.set(scenarioId, msgs);
    }
    return this.messages.get(scenarioId) || [];
  }

  async addMessage(data: {
    scenarioId: string;
    characterId?: string;
    content: string;
    actions?: string[];
    dialogue?: string;
    imageUrl?: string;
    audioUrl?: string;
    isPrivateBetween?: string[];
  }): Promise<Message> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioId: data.scenarioId,
      characterId: data.characterId,
      content: data.content,
      actions: data.actions || [],
      dialogue: data.dialogue || '',
      timestamp: Date.now(),
      imageUrl: data.imageUrl,
      audioUrl: data.audioUrl,
      isPrivateBetween: data.isPrivateBetween
    };

    await saveMessage(message);

    // Update cache
    const cached = this.messages.get(data.scenarioId) || [];
    cached.unshift(message);
    this.messages.set(data.scenarioId, cached);

    // Update scenario last message time
    const scenario = await getScenario(data.scenarioId);
    if (scenario) {
      scenario.lastMessageAt = message.timestamp;
      await saveScenario(scenario);
    }

    appEvents.emit('message:new', message);
    return message;
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    // This would need a getMessageById method in storage
    // For now, emit event for UI update
    appEvents.emit('message:updated', { messageId, updates });
  }

  // ===== USER MESSAGE HANDLING =====

  async sendMessage(
    scenarioId: string,
    characterId: string,
    content: string
  ): Promise<Message | null> {
    const character = characterStore.get(characterId);
    if (!character) {
      appEvents.emit('toast', { message: 'Character not found', type: 'error' });
      return null;
    }

    // Parse content for actions (between ** or *) and dialogue (between "")
    const { actions, dialogue } = this.parseContent(content);

    const message = await this.addMessage({
      scenarioId,
      characterId,
      content,
      actions,
      dialogue
    });

    // Trigger next character if auto-scenario
    const queue = this.turnQueues.get(scenarioId);
    if (queue) {
      queue.addToQueue({
        id: `turn_${Date.now()}`,
        type: 'user',
        characterId,
        content,
        actions,
        dialogue,
        timestamp: Date.now()
      });
    }

    return message;
  }

  // ===== TURN QUEUE =====

  initializeTurnQueue(scenario: Scenario, characters: Character[]): TurnQueueManager {
    const queue = new TurnQueueManager(scenario, characters);
    this.turnQueues.set(scenario.id, queue);
    this.activeScenarioId = scenario.id;
    return queue;
  }

  getTurnQueue(scenarioId: string): TurnQueueManager | undefined {
    return this.turnQueues.get(scenarioId);
  }

  pauseAutoScenario(scenarioId: string): void {
    const queue = this.turnQueues.get(scenarioId);
    if (queue) {
      queue.pause();
      appEvents.emit('auto-scenario:paused', scenarioId);
    }
  }

  resumeAutoScenario(scenarioId: string): void {
    const queue = this.turnQueues.get(scenarioId);
    if (queue) {
      queue.resume();
      appEvents.emit('auto-scenario:resumed', scenarioId);
    }
  }

  // ===== CONTENT PARSING =====

  private parseContent(content: string): { actions: string[]; dialogue: string } {
    const actions: string[] = [];
    let dialogue = '';

    // Extract actions between **text** or *text*
    const actionRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      const action = match[1] || match[2];
      if (action && !action.startsWith('