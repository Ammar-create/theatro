import { getAllCharacters, saveCharacter, deleteCharacter } from '../core/storage.js';
import { Character } from '../types/index.js';
import { appEvents } from './index.js';
import { generateImage } from '../services/providers.js';

class CharacterStore {
  private characters: Map<string, Character> = new Map();
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    const chars = await getAllCharacters();
    chars.forEach(c => this.characters.set(c.id, c));
    this.isLoaded = true;
    appEvents.emit('characters:loaded', this.getAll());
  }

  getAll(): Character[] {
    return Array.from(this.characters.values());
  }

  get(id: string): Character | undefined {
    return this.characters.get(id);
  }

  async create(data: Partial<Character>): Promise<Character> {
    const character: Character = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || 'Unnamed',
      color: data.color || '#8b5cf6',
      personality: data.personality || '',
      appearance: data.appearance || '',
      voice: data.voice || '',
      voiceDescription: data.voiceDescription || '',
      modelId: data.modelId || 'llama-scout',
      providerId: data.providerId || 'pollinations-p',
      avatar: data.avatar || '',
      avatarType: data.avatarType || 'url',
      isUser: data.isUser || false,
      speechPatterns: data.speechPatterns || [],
      defaultMood: data.defaultMood || 'neutral',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveCharacter(character);
    this.characters.set(character.id, character);
    appEvents.emit('character:created', character);
    return character;
  }

  async update(id: string, data: Partial<Character>): Promise<Character | undefined> {
    const existing = this.characters.get(id);
    if (!existing) return undefined;

    const updated: Character = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: Date.now()
    };

    await saveCharacter(updated);
    this.characters.set(id, updated);
    appEvents.emit('character:updated', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await deleteCharacter(id);
    this.characters.delete(id);
    appEvents.emit('character:deleted', id);
  }

  async setAsUser(id: string): Promise<void> {
    for (const [charId, char] of this.characters) {
      if (char.isUser) {
        const updated = { ...char, isUser: false };
        await saveCharacter(updated);
        this.characters.set(charId, updated);
      }
    }

    const char = this.characters.get(id);
    if (char) {
      const updated = { ...char, isUser: true };
      await saveCharacter(updated);
      this.characters.set(id, updated);
      appEvents.emit('user-character:changed', updated);
    }
  }

  async getUserCharacter(): Promise<Character | undefined> {
    for (const char of this.characters.values()) {
      if (char.isUser) return char;
    }
    return undefined;
  }

  async generateAvatar(characterId: string, prompt: string): Promise<string | undefined> {
    try {
      const imageUrl = await generateImage(prompt);
      await this.update(characterId, { 
        avatar: imageUrl, 
        avatarType: 'ai-generated' 
      });
      return imageUrl;
    } catch (error) {
      console.error('Avatar generation failed:', error);
      return undefined;
    }
  }

  async importCharacters(characters: Character[]): Promise<void> {
    for (const char of characters) {
      await saveCharacter(char);
      this.characters.set(char.id, char);
    }
    appEvents.emit('characters:loaded', this.getAll());
  }

  clearCache(): void {
    this.characters.clear();
    this.isLoaded = false;
  }
}

export const characterStore = new CharacterStore();
