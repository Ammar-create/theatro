// ===== CORE TYPES =====

export interface Character {
  id: string;
  name: string;
  color: string;
  personality: string;
  appearance: string;
  voice?: string;
  voiceDescription?: string;
  modelId: string;
  providerId: string;
  avatar?: string;
  avatarType: 'upload' | 'url' | 'ai-generated';
  isUser: boolean;
  speechPatterns: string[];
  defaultMood: string;
  createdAt: number;
  updatedAt: number;
}

export interface Scenario {
  id: string;
  name: string;
  lore: string;
  characterIds: string[];
  settings: ScenarioSettings;
  parentId?: string;
  summary: string;
  isActive: boolean;
  lastMessageAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScenarioSettings {
  aiKnowsUser: boolean;
  autoScenario: boolean;
  autoImageGeneration: boolean;
  controllerCheckFrequency: number;
  shortTermMemorySize: number;
  privateChannels: PrivateChannel[];
  whatNext?: string;
  briefDetails?: string;
}

export interface PrivateChannel {
  characterIdA: string;
  characterIdB: string;
}

export interface Message {
  id: string;
  scenarioId: string;
  characterId?: string;
  content: string;
  actions: string[];
  dialogue: string;
  timestamp: number;
  imageUrl?: string;
  audioUrl?: string;
  isPrivateBetween?: string[];
  modelUsed?: string;
  generationTime?: number;
  edited?: boolean;
  parentId?: string;
  isSystemMessage?: boolean;
}

export interface RelationshipMatrix {
  scenarioId: string;
  matrix: Record<string, RelationshipState>;
  updatedAt: number;
}

export interface RelationshipState {
  mood: string;
  intensity: number;
  reason: string;
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  timestamp: number;
  change: string;
  triggerMessageId?: string;
}

export interface Memory {
  characterId: string;
  scenarioId: string;
  summary: string;
  privateKnowledge: string[];
  witnessedMessageIds: string[];
  lastUpdated: number;
}

export type ControllerType = 'main' | 'scenario' | 'creative' | 'media';

export interface ControllerOutput {
  version: string;
  directives: Directive[];
}

export type Directive =
  | MoodDirective
  | WhisperDirective
  | SceneShiftDirective
  | RequestScenarioDirective
  | AutoImageDirective;

export interface MoodDirective {
  type: 'mood';
  characterId: string;
  mood: string;
  reason: string;
  intensity: number;
  expiresAfterMessages?: number;
}

export interface WhisperDirective {
  type: 'whisper';
  characterId: string;
  targetId: string;
  content: string;
}

export interface SceneShiftDirective {
  type: 'scene_shift';
  location: string;
  atmosphere: string;
  sensoryDetails?: string[];
}

export interface RequestScenarioDirective {
  type: 'request_scenario_controller';
  reason: string;
}

export interface AutoImageDirective {
  type: 'auto_generate_image';
  prompt: string;
  reason: string;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  isDefault: boolean;
  type: 'pollinations' | 'aqua' | 'custom';
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  contextWindow: number;
  capabilities: ('chat' | 'image' | 'voice' | 'vision')[];
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  system?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamingChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface SidePanelState {
  isOpen: boolean;
  activeTab: 'next' | 'details' | 'matrix' | 'memory' | 'debug' | 'characters' | 'settings';
}

export type LayoutMode = 'dm' | 'group';

export interface AppState {
  currentScenarioId?: string;
  sidePanel: SidePanelState;
  isAutoScenarioRunning: boolean;
  streamingMessageId?: string;
  selectedCharacters: string[];
  pendingTurnQueue: TurnQueueItem[];
}

export interface TurnQueueItem {
  id: string;
  type: 'character' | 'controller' | 'user';
  characterId?: string;
  controllerType?: ControllerType;
  content?: string;
  actions?: string[];
  dialogue?: string;
  directive?: string;
  timestamp: number;
}

export interface GlobalSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  defaultProvider: string;
  defaultCharacterModel: string;
  defaultControllerModel: string;
  defaultImageModel: string;
  defaultVoiceModel: string;
  autoSaveInterval: number;
  maxCharactersPerScenario: number;
  debugMode: boolean;
}

export interface UserCharacter {
  characterId: string;
  description: string;
}

// ===== EXPORT/IMPORT =====

export interface ExportData {
  version: string;
  exportedAt: number;
  characters: Character[];
  scenarios: Scenario[];
  messages: Message[];
  memories: Memory[];
  relationships: RelationshipMatrix[];
  providers: Provider[];
  settings: Record<string, unknown>;
}
