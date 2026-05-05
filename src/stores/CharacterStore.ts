import { getAllCharacters, saveCharacter, deleteCharacter, getUserCharacter } from '../core/storage.js';
import type { Character } from '../types/index.js';

export class CharacterStore {
  async getAll(): Promise<Character[]> {
    return getAllCharacters();
  }

  async getById(id: string): Promise<Character | undefined> {
    const chars = await getAllCharacters();
    return chars.find(c => c.id === id);
  }

  async getUser(): Promise<Character | undefined> {
    return getUserCharacter();
  }

  async create(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const character: Character = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveCharacter(character);
    return character;
  }

  async update(id: string, updates: Partial<Character>): Promise<void> {
    const char = await this.getById(id);
    if (!char) throw new Error('Character not found');
    
    const updated = { ...char, ...updates, updatedAt: Date.now() };
    await saveCharacter(updated);
  }

  async delete(id: string): Promise<void> {
    await deleteCharacter(id);
  }

  generateInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  generateAvatarColor(): string {
    const colors = ['#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
