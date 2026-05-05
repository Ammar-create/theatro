import { characterStore } from './CharacterStore.js';
import { scenarioStore } from './ScenarioStore.js';
import { providerStore } from './ProviderStore.js';
import { settingsStore } from './SettingsStore.js';

export { characterStore } from './CharacterStore.js';
export { scenarioStore } from './ScenarioStore.js';
export { chatStore } from './ChatStore.js';
export { appEvents, appState } from './appState.js';
export { providerStore } from './ProviderStore.js';
export { settingsStore } from './SettingsStore.js';

export async function initializeStores(): Promise<void> {
  await Promise.all([
    characterStore.load(),
    scenarioStore.load(),
    providerStore.load(),
    settingsStore.load(),
  ]);
}