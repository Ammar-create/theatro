import { chatStore } from './ChatStore.js';
import { characterStore } from './CharacterStore.js';
import { scenarioStore } from './ScenarioStore.js';
import { appEvents, appState } from './appState.js';

export { characterStore } from './CharacterStore.js';
export { scenarioStore } from './ScenarioStore.js';
export { chatStore } from './ChatStore.js';
export { appEvents, appState } from './appState.js';

export async function initializeStores(): Promise<void> {
  await characterStore.load();
  await scenarioStore.load();
}
