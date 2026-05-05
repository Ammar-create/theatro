// ===== PROMPT BUILDER =====
import {
  Character, Scenario, Memory, RelationshipMatrix, 
  Message, Directive
} from '../types/index.js';
import { getCharacter } from '../core/storage.js';

export async function buildCharacterPrompt(
  character: Character,
  scenario: Scenario,
  memory: Memory | undefined,
  relationshipMatrix: RelationshipMatrix | undefined,
  recentMessages: Message[],
  directive?: Partial<Directive>
): Promise<string> {
  const lines: string[] = [];
  
  // === SYSTEM: Character Identity ===
  lines.push(`You are ${character.name}.`);
  lines.push(`\n${character.personality}`);
  lines.push(`\nDefault mood: ${character.defaultMood}`);
  if (character.speechPatterns.length) {
    lines.push(`\nSpeech patterns: ${character.speechPatterns.join(', ')}`);
  }
  
  // === SYSTEM: Appearance for context ===
  lines.push(`\n${character.appearance}`);
  if (character.voiceDescription) {
    lines.push(`\nVoice/Tone: ${character.voiceDescription}`);
  }
  
  // === SCENARIO CONTEXT ===
  lines.push(`\n\n=== SCENARIO ===`);
  lines.push(`Name: ${scenario.name}`);
  lines.push(`\nLore/Setting:\n${scenario.lore}`);
  
  if (scenario.summary) {
    lines.push(`\n\nPlot Summary so far:\n${scenario.summary}`);
  }
  
  // === RELATIONSHIPS ===
  if (relationshipMatrix) {
    const charRelationships = Object.entries(relationshipMatrix.matrix)
      .filter(([key]) => key.includes(character.id))
      .map(([key, state]) => {
        const otherCharId = key.replace(`${character.id}→`, '').replace(`→${character.id}`, '');
        return `[${state.mood} toward ${otherCharId}] ${state.reason}`;
      });
    
    if (charRelationships.length) {
      lines.push(`\n\n=== RELATIONSHIPS ===`);
      lines.push(charRelationships.join('\n'));
    }
  }
  
  // === MEMORY ===
  if (memory?.summary) {
    lines.push(`\n\n=== YOUR MEMORY ===`);
    lines.push(memory.summary);
  }
  
  if (memory?.privateKnowledge.length) {
    lines.push(`\n\nPrivate knowledge: ${memory.privateKnowledge.join(' | ')}`);
  }
  
  // === RECENT MESSAGES (Short-term) ===
  if (recentMessages.length) {
    lines.push(`\n\n=== RECENT CONVERSATION ===`);
    const recent = recentMessages.slice(-10);
    for (const msg of recent) {
      const char = await getCharacter(msg.characterId || '');
      const name = char?.name || 'Unknown';
      lines.push(`\n**${name}**`);
      if (msg.actions.length) {
        lines.push(msg.actions.map(a => `*${a}*`).join(' '));
      }
      lines.push(`"${msg.dialogue}"`);
    }
  }
  
  // === DIRECTIVE (Controller mood shift) ===
  if (directive && directive.type === 'mood') {
    lines.push(`\n\n=== CURRENT EMOTIONAL STATE ===`);
    lines.push(`You feel ${directive.mood}.`);
    if (directive.reason) {
      lines.push(`Reason: ${directive.reason}`);
    }
    lines.push(`\nExpress this subtly in your response. Do not announce your mood.`);
  }
  
  // === USER KNOWLEDGE SETTING ===
  if (!scenario.settings.aiKnowsUser) {
    lines.push(`\n\nNote: Do not treat any participant as "the user". Everyone is a character in the story.`);
  }
  
  // === FORMAT INSTRUCTION ===
  lines.push(`\n\n=== RESPONSE FORMAT ===`);
  lines.push(`Actions (what your character does): *italics action text* or **bold action**`);
  lines.push(`Dialogue: "spoken words in quotes"`);
  lines.push(`Stay in character. Respond naturally as ${character.name}.`);
  lines.push(`Do not break character. Do not reference AI, controllers, or generation.`);
  
  return lines.join('\n');
}

export async function buildControllerPrompt(
  controllerType: 'main' | 'scenario' | 'creative',
  context: {
    scenario?: Scenario;
    messages?: Message[];
    characters?: Character[];
    relationships?: RelationshipMatrix;
    userDirective?: string;
    briefDetails?: string;
    characterTemplate?: any;
  }
): Promise<string> {
  switch (controllerType) {
    case 'main':
      return buildMainControllerPrompt(context);
    case 'scenario':
      return buildScenarioControllerPrompt(context);
    case 'creative':
      return buildCreativeControllerPrompt(context);
    default:
      return '';
  }
}

function buildMainControllerPrompt(ctx: any): string {
  const lines = [
    `You are the Main Controller for Theatro, a narrative engine.`,
    `Analyze the conversation and output STRICT JSON directives.`,
    `\nOutput format: { "version": "1.0", "directives": [...], "analysis": {...} }`,
    `\nRules:`,
    `- Characters do NOT know they're AI.`,
    `- Mood presets are subtle, not puppet strings.`,
    `- Respect character history: grudges, attractions persist.`,
    `- Private conversations influence overhearers.`,
    `\n=== CURRENT SCENARIO ===`,
    ctx.scenario?.name,
    ctx.scenario?.lore,
    `\n=== CHARACTERS ===`,
    ctx.characters?.map((c: Character) => `${c.name}: ${c.personality.slice(0, 200)}...`).join('\n\n'),
    `\n=== RECENT MESSAGES ===`,
    ctx.messages?.map((m: Message) => {
      const char = ctx.characters?.find((c: Character) => c.id === m.characterId);
      return `[${char?.name || 'Unknown'}]: ${m.content.slice(0, 200)}`;
    }).join('\n'),
  ];
  
  return lines.filter(Boolean).join('\n');
}

function buildScenarioControllerPrompt(ctx: any): string {
  const lines = [
    `You are the Scenario Controller for Theatro.`,
    `Shape the environment, inject surprises, advance story arcs.`,
    `\nOutput STRICT JSON.`,
    `\n=== CURRENT SCENARIO ===`,
    ctx.scenario?.name,
    ctx.scenario?.lore,
    `\n=== USER DIRECTIVE ===`,
    ctx.userDirective || 'Continue the story naturally.',
    `\n=== BRIEF DETAILS ===`,
    ctx.briefDetails || '',
    `\n=== CHARACTERS ===`,
    ctx.characters?.map((c: Character) => `${c.name}: ${c.personality.slice(0, 150)}...`).join('\n'),
    `\n=== RELATIONSHIPS ===`,
    ctx.relationships?.matrix ? JSON.stringify(ctx.relationships.matrix, null, 2) : '{}',
  ];
  
  return lines.filter(Boolean).join('\n');
}

function buildCreativeControllerPrompt(ctx: any): string {
  const lines = [
    `You are the Creative Controller for Theatro.`,
    `Generate complete character sheets from brief descriptions.`,
    `\nOutput STRICT JSON with character object and image prompt.`,
    `\n=== BRIEF DESCRIPTION ===`,
    ctx.characterTemplate?.brief || ctx.briefDetails || '',
    `\nGuidelines:`,
    `- Names memorable and unique.`,
    `- Colors are emotional signatures.`,
    `- Include contradictions in personality.`,
    `- Appearance includes movement/style, not just static features.`,
  ];
  
  return lines.filter(Boolean).join('\n');
}