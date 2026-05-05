// ===== TURN QUEUE MANAGER =====
import { 
  TurnQueueItem, Message, Character, Scenario, 
  RelationshipMatrix 
} from '../types/index.js';
import { 
  saveMessage, getMessagesForScenario, 
  getMemory, saveMemory, getRelationshipMatrix, 
  saveRelationshipMatrix 
} from '../core/storage.js';
import { streamChat, generateImage } from './providers.js';
import { buildCharacterPrompt } from './promptBuilder.js';
import { createControllerAdapter } from './controllers.js';
import { appEvents } from '../stores/index.js';

export class TurnQueueManager {
  private queue: TurnQueueItem[] = [];
  private isProcessing = false;
  private isPaused = false;
  private scenario: Scenario;
  private characters: Map<string, Character> = new Map();
  private messageCount = 0;
  private maxMessagesBeforeController = 10;
  
  constructor(scenario: Scenario, characters: Character[]) {
    this.scenario = scenario;
    this.maxMessagesBeforeController = scenario.settings.controllerCheckFrequency || 10;
    characters.forEach(c => this.characters.set(c.id, c));
  }

  async addToQueue(item: TurnQueueItem): Promise<void> {
    this.queue.push(item);
    if (!this.isProcessing && !this.isPaused) {
      this.processQueue();
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  clear(): void {
    this.queue = [];
  }

  getQueue(): TurnQueueItem[] {
    return [...this.queue];
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && !this.isPaused) {
      const item = this.queue.shift()!;
      try {
        await this.processItem(item);
      } catch (error) {
        console.error('Turn processing error:', error);
        appEvents.emit('toast', { message: `Error: ${error}`, type: 'error' });
      }
    }
    
    this.isProcessing = false;
  }

  private async processItem(item: TurnQueueItem): Promise<void> {
    switch (item.type) {
      case 'user':
        await this.processUserMessage(item);
        break;
      case 'character':
        await this.processCharacterTurn(item);
        break;
      case 'controller':
        await this.processControllerTurn(item);
        break;
    }
  }

  private async processUserMessage(item: TurnQueueItem): Promise<void> {
    if (!item.characterId) return;
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const msg: Message = {
      id: messageId,
      scenarioId: this.scenario.id,
      characterId: item.characterId,
      content: item.content || '',
      actions: item.actions || [],
      dialogue: item.dialogue || '',
      timestamp: Date.now()
    };
    
    await saveMessage(msg);
    this.messageCount++;
    appEvents.emit('message:new', msg);
    
    if (this.messageCount >= this.maxMessagesBeforeController) {
      await this.triggerMainController();
    }
    
    // Auto-scenario: next character responds
    if (this.scenario.settings.autoScenario) {
      this.selectNextCharacter(item.characterId);
    }
  }

  private async processCharacterTurn(item: TurnQueueItem): Promise<void> {
    if (!item.characterId) return;
    
    const character = this.characters.get(item.characterId);
    if (!character) return;
    
    const recentMessages = await getMessagesForScenario(this.scenario.id, 30);
    const memory = await getMemory(character.id, this.scenario.id);
    const relationshipMatrix = await getRelationshipMatrix(this.scenario.id);
    
    // Build API-compatible messages separately from the prompt messages
    const apiMessages: { role: 'assistant'; content: string }[] = recentMessages.map(m => ({
      role: 'assistant' as const,
      content: this.formatMessageForPrompt(m)
    }));
    
    const prompt = await buildCharacterPrompt(
      character,
      this.scenario,
      memory,
      relationshipMatrix,
      recentMessages,
      item.directive
    );
    
    const streamingId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    appEvents.emit('streaming:start', { messageId: streamingId, characterId: character.id });
    
    let fullContent = '';
    try {
      // streamChat returns Promise<AsyncGenerator> — await it first
      const generator = await streamChat({
        model: character.modelId,
        messages: [{ role: 'system', content: prompt }, ...apiMessages],
        temperature: 0.8,
        stream: true
      }, character.providerId);

      for await (const chunk of generator) {
        if (chunk.content) {
          fullContent += chunk.content;
          appEvents.emit('streaming:chunk', { 
            messageId: streamingId, 
            chunk: chunk.content 
          });
        }
        if (chunk.done) {
          appEvents.emit('streaming:end', { 
            messageId: streamingId, 
            content: fullContent 
          });
        }
      }
      
      const { dialogue, actions } = this.parseResponse(fullContent);
      
      const msg: Message = {
        id: streamingId,
        scenarioId: this.scenario.id,
        characterId: character.id,
        content: fullContent,
        actions,
        dialogue,
        timestamp: Date.now(),
        modelUsed: character.modelId
      };
      
      await saveMessage(msg);
      this.messageCount++;
      appEvents.emit('message:new', msg);
      
      // Update character memory
      await this.updateCharacterMemory(character.id, msg);
      
      if (this.messageCount >= this.maxMessagesBeforeController) {
        await this.triggerMainController();
      }
      
      // Auto-scenario: continue
      if (this.scenario.settings.autoScenario && !this.isPaused) {
        setTimeout(() => this.selectNextCharacter(character.id), 500);
      }
      
    } catch (error) {
      appEvents.emit('streaming:error', { messageId: streamingId, error });
      throw error;
    }
  }

  private async processControllerTurn(item: TurnQueueItem): Promise<void> {
    const controllerAdapter = createControllerAdapter(item.controllerType!);
    
    const recentMessages = await getMessagesForScenario(this.scenario.id, 20);
    const relationshipMatrix = await getRelationshipMatrix(this.scenario.id);
    
    appEvents.emit('controller:start', { 
      type: item.controllerType, 
      messageCount: this.messageCount 
    });
    
    let controllerOutput = '';
    for await (const chunk of controllerAdapter.run(
      this.scenario,
      recentMessages,
      relationshipMatrix,
      item.directive
    )) {
      controllerOutput += chunk;
      appEvents.emit('controller:chunk', { type: item.controllerType, chunk });
    }
    
    try {
      const directives = JSON.parse(controllerOutput);
      await this.applyDirectives(directives);
      appEvents.emit('controller:end', { type: item.controllerType, directives });
    } catch (error) {
      console.error('Controller output parse error:', error);
      appEvents.emit('controller:error', { type: item.controllerType, error });
    }
  }

  private async triggerMainController(): Promise<void> {
    this.messageCount = 0;
    this.queue.push({
      id: `ctrl_${Date.now()}`,
      type: 'controller',
      controllerType: 'main',
      timestamp: Date.now()
    });
  }

  private selectNextCharacter(currentCharacterId?: string): void {
    const activeIds = this.scenario.characterIds;
    let nextIndex = 0;
    
    if (currentCharacterId) {
      const currentIndex = activeIds.indexOf(currentCharacterId);
      nextIndex = (currentIndex + 1) % activeIds.length;
    }
    
    const nextId = activeIds[nextIndex];
    this.queue.push({
      id: `char_${Date.now()}`,
      type: 'character',
      characterId: nextId,
      timestamp: Date.now()
    });
    
    if (!this.isProcessing && !this.isPaused) {
      this.processQueue();
    }
  }

  private formatMessageForPrompt(msg: Message): string {
    const char = this.characters.get(msg.characterId || '');
    const name = char?.name || 'Unknown';
    let formatted = `**${name}**\n`;
    if (msg.actions.length) {
      formatted += msg.actions.map(a => `*${a}*`).join(' ') + '\n';
    }
    formatted += `"${msg.dialogue}"`;
    return formatted;
  }

  private parseResponse(content: string): { dialogue: string; actions: string[] } {
    const actions: string[] = [];
    let dialogue = content;
    
    // Extract actions: *text* or **text**
    const actionRegex = /\*([^*]+)\*/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      if (!match[1].includes('"')) {
        actions.push(match[1].trim());
      }
    }
    
    // Extract dialogue: "quoted text"
    const dialogueRegex = /"([^"]+)"/g;
    const dialogueMatches = dialogue.match(dialogueRegex);
    if (dialogueMatches) {
      dialogue = dialogueMatches.join(' ').replace(/"/g, '');
    }
    
    return { dialogue, actions };
  }

  private async updateCharacterMemory(characterId: string, message: Message): Promise<void> {
    let memory = await getMemory(characterId, this.scenario.id);
    
    if (!memory) {
      memory = {
        characterId,
        scenarioId: this.scenario.id,
        summary: '',
        privateKnowledge: [],
        witnessedMessageIds: [],
        lastUpdated: Date.now()
      };
    }
    
    memory.witnessedMessageIds.push(message.id);
    if (memory.witnessedMessageIds.length > 50) {
      memory.witnessedMessageIds = memory.witnessedMessageIds.slice(-50);
    }
    
    await saveMemory(memory);
  }

  private async applyDirectives(directives: any): Promise<void> {
    if (!directives.directives) return;
    
    for (const directive of directives.directives) {
      switch (directive.type) {
        case 'mood':
          // Store mood in relationship matrix
          await this.updateRelationshipMood(directive);
          break;
        case 'scene_shift':
          // Update scenario with new scene
          this.scenario.lore += `\n\n[Scene: ${directive.location}]\n${directive.atmosphere}`;
          break;
        case 'auto_generate_image':
          // Trigger image generation
          const imageUrl = await generateImage(directive.prompt);
          appEvents.emit('image:generated', { url: imageUrl, prompt: directive.prompt });
          break;
      }
    }
    
    if (directives.summary_addition) {
      this.scenario.summary += `\n${directives.summary_addition}`;
    }
  }

  private async updateRelationshipMood(directive: any): Promise<void> {
    let matrix = await getRelationshipMatrix(this.scenario.id);
    
    if (!matrix) {
      matrix = {
        scenarioId: this.scenario.id,
        matrix: {},
        updatedAt: Date.now()
      };
    }
    
    const key = `${directive.from || directive.characterId}→${directive.to}`;
    if (!matrix.matrix[key]) {
      matrix.matrix[key] = {
        mood: directive.mood,
        intensity: directive.intensity || 5,
        reason: directive.reason || '',
        history: []
      };
    } else {
      matrix.matrix[key].mood = directive.mood;
      matrix.matrix[key].intensity = directive.intensity || 5;
      matrix.matrix[key].reason = directive.reason || '';
      matrix.matrix[key].history.push({
        timestamp: Date.now(),
        change: directive.reason || ''
      });
    }
    
    await saveRelationshipMatrix(matrix);
    appEvents.emit('relationships:updated', matrix);
  }
}