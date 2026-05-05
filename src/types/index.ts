export interface TurnQueueItem {
  id: string;
  type: 'character' | 'controller' | 'user';
  characterId?: string;
  controllerType?: ControllerType;
  content?: string;
  actions?: string[];
  dialogue?: string;
  /** Optional directive string passed to the character/controller for this turn */
  directive?: string;
  timestamp: number;
}