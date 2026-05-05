export { characterStore } from './CharacterStore.js';
export { scenarioStore } from './ScenarioStore.js';
export { chatStore } from './ChatStore.js';
export { appEvents, appState } from './appState.js';

export async function initializeStores(): Promise<void> {
  await characterStore.load();
  await scenarioStore.load();
}