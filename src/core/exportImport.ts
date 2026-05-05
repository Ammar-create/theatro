import { Character, Scenario, Message, ExportData } from '../types/index.js';
import { getDB } from './storage.js';

// ===== EXPORT/IMPORT SYSTEM =====

export async function exportAllData(): Promise<ExportData> {
  const db = await getDB();
  
  const [
    characters,
    scenarios,
    messages,
    memories,
    relationships,
    providers,
    settingsKeys
  ] = await Promise.all([
    db.getAll('characters'),
    db.getAll('scenarios'),
    db.getAll('messages'),
    db.getAll('memories'),
    db.getAll('relationships'),
    db.getAll('providers'),
    db.getAllKeys('settings'),
  ]);

  const settings: Record<string, any> = {};
  for (const key of settingsKeys) {
    settings[key as string] = await db.get('settings', key);
  }

  return {
    version: '1.0',
    exportedAt: Date.now(),
    characters: characters as Character[],
    scenarios: scenarios as Scenario[],
    messages: messages as Message[],
    memories: memories as any[],
    relationships: relationships as any[],
    providers: providers as any[],
    settings
  };
}

export async function importAllData(data: ExportData, merge = false): Promise<{ imported: { scenarios: number; characters: number; messages: number }; errors: string[] }> {
  const db = await getDB();
  const errors: string[] = [];
  const result = { scenarios: 0, characters: 0, messages: 0 };

  if (!merge) {
    await Promise.all([
      db.clear('characters'),
      db.clear('scenarios'),
      db.clear('messages'),
      db.clear('memories'),
      db.clear('relationships'),
    ]);
  }

  if (data.characters) {
    for (const char of data.characters) {
      try {
        if (merge) {
          const existing = await db.get('characters', char.id);
          if (existing) char.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        }
        await db.put('characters', char);
        result.characters++;
      } catch (e) {
        errors.push(`Failed to import character ${char.name}: ${e}`);
      }
    }
  }

  if (data.scenarios) {
    for (const scen of data.scenarios) {
      try {
        if (merge) {
          const existing = await db.get('scenarios', scen.id);
          if (existing) scen.id = `scen_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        }
        await db.put('scenarios', scen);
        result.scenarios++;
      } catch (e) {
        errors.push(`Failed to import scenario ${scen.name}: ${e}`);
      }
    }
  }

  if (data.messages) {
    for (const msg of data.messages) {
      try {
        msg.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.put('messages', msg);
        result.messages++;
      } catch (e) {
        errors.push(`Failed to import message: ${e}`);
      }
    }
  }

  if (data.memories) {
    for (const mem of data.memories) {
      try { await db.put('memories', mem); } catch (e) { errors.push(`Memory: ${e}`); }
    }
  }

  if (data.relationships) {
    for (const rel of data.relationships) {
      try { await db.put('relationships', rel); } catch (e) { errors.push(`Relations: ${e}`); }
    }
  }

  return { imported: result, errors };
}

export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

export async function readJSONFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target?.result as string)); } 
      catch (err) { reject(new Error('Invalid JSON')); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
