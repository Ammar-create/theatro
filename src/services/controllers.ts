// ===== CONTROLLERS SERVICE =====
import { 
  Scenario, Message, RelationshipMatrix, ControllerType 
} from '../types/index.js';
import { streamChat, getDefaultProvider } from './providers.js';
import { buildControllerPrompt } from './promptBuilder.js';

export interface ControllerAdapter {
  type: ControllerType;
  run(
    scenario: Scenario,
    messages: Message[],
    relationships: RelationshipMatrix | undefined,
    directive?: any
  ): AsyncGenerator<string>;
}

class MainControllerAdapter implements ControllerAdapter {
  type: ControllerType = 'main';
  private model = 'llama-scout';
  private providerId = 'pollinations-p';

  async *run(
    scenario: Scenario,
    messages: Message[],
    relationships: RelationshipMatrix | undefined,
    directive?: any
  ): AsyncGenerator<string> {
    const provider = await getDefaultProvider();
    if (provider) {
      this.providerId = provider.id;
      this.model = 'grok-4.1-thinking';
    }

    const prompt = await buildControllerPrompt('main', {
      scenario,
      messages,
      characters: [],
      relationships
    });

    yield* streamChat({
      model: this.model,
      messages: [
        { role: 'system', content: await this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      stream: true
    }, this.providerId);
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are the Main Controller for Theatro, a narrative engine.

Your job:
1. Analyze recent conversation
2. Update character relationships
3. Issue subtle mood directives
4. Maintain plot summary
5. Detect when to invoke Scenario Controller

Output ONLY valid JSON:
{
  "version": "1.0",
  "directives": [
    { "type": "mood", "characterId": "id", "mood": "emotion", "reason": "why", "intensity": 1-10 },
    { "type": "scene_shift", "location": "place", "atmosphere": "mood" },
    { "type": "auto_generate_image", "prompt": "description", "reason": "why" }
  ],
  "analysis": {
    "tension_level": 1-10,
    "emotional_tone": "description",
    "key_developments": ["event1", "event2"]
  },
  "summary_addition": "what happened",
  "should_invoke_scenario_controller": true/false,
  "scenario_controller_reason": "why"
}

Rules:
- Mood presets are SUBTLE emotional backgrounds, not puppet strings.
- Characters remember grudges, attractions, betrayals.
- Private conversations marked isPrivateBetween influence overhearers.
- NEVER make characters break character.
- JSON ONLY. No markdown, no explanation.`;
  }
}

class ScenarioControllerAdapter implements ControllerAdapter {
  type: ControllerType = 'scenario';
  private model = 'llama-scout';
  private providerId = 'pollinations-p';

  async *run(
    scenario: Scenario,
    messages: Message[],
    relationships: RelationshipMatrix | undefined,
    directive?: any
  ): AsyncGenerator<string> {
    const provider = await getDefaultProvider();
    if (provider) {
      this.providerId = provider.id;
    }

    const prompt = await buildControllerPrompt('scenario', {
      scenario,
      messages,
      characters: [],
      relationships,
      userDirective: directive?.whatHappensNext,
      briefDetails: directive?.briefDetails
    });

    yield* streamChat({
      model: this.model,
      messages: [
        { role: 'system', content: await this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      stream: true
    }, this.providerId);
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are the Scenario Controller for Theatro. Shape the narrative.

Output ONLY valid JSON:
{
  "version": "1.0",
  "scene_update": {
    "location_changed": true/false,
    "new_location": "description",
    "atmosphere": "mood lighting",
    "sensory_details": ["sound", "smell"]
  },
  "injected_events": [
    {
      "type": "eavesdropping|arrival|departure|discovery|revelation",
      "target_character": "id",
      "content": "what happens",
      "consequences": ["effect1", "effect2"]
    }
  ],
  "character_movements": [
    { "character_id": "id", "action": "enters|exits|moves_to|overhears", "details": "" }
  ],
  "arc_progression": "how story moved forward"
}

Narrative Principles:
- Surprises feel earned, not random.
- Eavesdropping creates dramatic irony.
- Scene shifts happen naturally.
- Maintain continuity.
- JSON ONLY.`;
  }
}

class CreativeControllerAdapter implements ControllerAdapter {
  type: ControllerType = 'creative';
  private model = 'llama-scout';
  private providerId = 'pollinations-p';

  async *run(
    scenario: Scenario,
    messages: Message[],
    relationships: RelationshipMatrix | undefined,
    directive?: any
  ): AsyncGenerator<string> {
    const provider = await getDefaultProvider();
    if (provider) {
      this.providerId = provider.id;
    }

    const prompt = directive?.brief || directive?.characterTemplate?.brief || '';

    yield* streamChat({
      model: this.model,
      messages: [
        { role: 'system', content: await this.getSystemPrompt() },
        { role: 'user', content: `Generate a character based on this brief: ${prompt}` }
      ],
      temperature: 0.9,
      stream: true
    }, this.providerId);
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are the Creative Controller for Theatro. Generate vivid characters.

Output ONLY valid JSON:
{
  "version": "1.0",
  "character": {
    "name": "full name",
    "suggested_color": "#hexcode",
    "personality": "2-3 paragraphs: fears, desires, speech patterns, default mood, contradictions",
    "appearance": "2 paragraphs: physical, clothing, distinguishing marks, movement/style",
    "voice_description": "tone, pitch, accent, verbal tics",
    "default_mood": "how they typically present",
    "speech_patterns": ["pattern1", "pattern2"],
    "relationship_seeds": [
      {"toward_archetype": "authority", "default_stance": "resentful"}
    ]
  },
  "image_generation_prompt": "detailed prompt for avatar: subject, lighting, style, mood",
  "voice_recommendation": "which TTS voice fits best"
}

Guidelines:
- Names memorable and search-unique
- Colors are emotional signatures
- Include contradictions (brave but insecure)
- Appearance includes how they MOVE, not just static features
- JSON ONLY.`;
  }
}

class MediaControllerAdapter implements ControllerAdapter {
  type: ControllerType = 'media';

  async *run(
    scenario: Scenario,
    messages: Message[],
    relationships: RelationshipMatrix | undefined,
    directive?: any
  ): AsyncGenerator<string> {
    yield JSON.stringify({
      type: 'media_trigger',
      mediaType: directive?.mediaType || 'image',
      context: directive?.context || ''
    });
  }
}

export function createControllerAdapter(type: ControllerType): ControllerAdapter {
  switch (type) {
    case 'main':
      return new MainControllerAdapter();
    case 'scenario':
      return new ScenarioControllerAdapter();
    case 'creative':
      return new CreativeControllerAdapter();
    case 'media':
      return new MediaControllerAdapter();
    default:
      throw new Error(`Unknown controller type: ${type}`);
  }
}