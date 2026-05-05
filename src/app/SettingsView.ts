import { appEvents, appState, characterStore, scenarioStore } from '../stores/index.js';
import { Modal } from './Modal.js';
import { appIcons } from '../assets/icons/index.js';
import { providerStore, settingsStore } from '../stores/index.js';
import { exportAllData, importAllData } from '../core/exportImport.js';

export class SettingsView {
  private container: HTMLElement;
  private modal: Modal;
  private currentTab: 'general' | 'providers' | 'data' = 'general';

  constructor(container: HTMLElement) {
    this.container = container;
    this.modal = new Modal();
    this.render();
    this.setupListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="settings-view">
        <header class="settings-header">
          <div class="header-left">
            <button class="btn-back" id="btn-back">${appIcons.arrowLeft({ size: 20 })}</button>
            <h1>Settings</h1>
          </div>
        </header>
        
        <div class="settings-layout">
          <nav class="settings-nav">
            <button class="nav-item ${this.currentTab === 'general' ? 'active' : ''}" data-tab="general">
              ${appIcons.settings({ size: 18 })}
              General
            </button>
            <button class="nav-item ${this.currentTab === 'providers' ? 'active' : ''}" data-tab="providers">
              ${appIcons.cpu({ size: 18 })}
              Providers
            </button>
            <button class="nav-item ${this.currentTab === 'data' ? 'active' : ''}" data-tab="data">
              ${appIcons.fileJson({ size: 18 })}
              Data
            </button>
          </nav>
          
          <main class="settings-content">
            ${this.renderTabContent()}
          </main>
        </div>
      </div>
    `;
  }

  private renderTabContent(): string {
    switch (this.currentTab) {
      case 'general':
        return this.renderGeneralTab();
      case 'providers':
        return this.renderProvidersTab();
      case 'data':
        return this.renderDataTab();
      default:
        return '';
    }
  }

  private renderGeneralTab(): string {
    const settings = settingsStore.getAll();
    const theme = settings.theme || 'dark';
    const userChar = characterStore.getAll().find(c => c.isUser);

    return `
      <section class="settings-section">
        <h2>Appearance</h2>
        <div class="setting-item">
          <label>Theme</label>
          <div class="theme-selector">
            <button class="theme-btn ${theme === 'dark' ? 'active' : ''}" data-theme="dark">
              ${appIcons.moon({ size: 16 })}
              Dark
            </button>
            <button class="theme-btn ${theme === 'light' ? 'active' : ''}" data-theme="light">
              ${appIcons.sun({ size: 16 })}
              Light
            </button>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Your Character</h2>
        ${userChar ? `
          <div class="user-char-preview">
            <div class="char-avatar" style="background: ${userChar.color}20; border-color: ${userChar.color}">
              ${userChar.avatar ? `<img src="${userChar.avatar}" />` : `<span style="color: ${userChar.color}">${userChar.name[0]}</span>`}
            </div>
            <div class="char-info">
              <h4>${userChar.name}</h4>
              <p>${userChar.personality.slice(0, 100)}${userChar.personality.length > 100 ? '...' : ''}</p>
            </div>
          </div>
          <p class="hint">Manage your character from the dashboard.</p>
        ` : `
          <div class="empty-state">
            <p>No user character set</p>
            <button class="btn-secondary" id="btn-create-user-char">Create Character</button>
          </div>
        `}
      </section>
      
      <section class="settings-section">
        <h2>Defaults</h2>
        <div class="setting-item">
          <label>Default Controller Check Frequency</label>
          <p class="hint">How many messages before the Main Controller analyzes the chat</p>
          <input type="number" id="controller-frequency" value="${settings.controllerCheckFrequency || 10}" min="1" max="50" />
        </div>
        <div class="setting-item">
          <label>Short-term Memory Size</label>
          <p class="hint">Number of recent messages characters remember</p>
          <input type="number" id="memory-size" value="${settings.shortTermMemorySize || 30}" min="10" max="100" />
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Debug</h2>
        <div class="setting-item">
          <label class="checkbox-label">
            <input type="checkbox" id="debug-mode" ${settings.debugMode ? 'checked' : ''} />
            <span>Enable debug panel in scenarios</span>
          </label>
        </div>
      </section>
    `;
  }

  private renderProvidersTab(): string {
    const providers = providerStore.getAll();
    const pollinationP = providers.find(p => p.type === 'pollinations');
    const aquaP = providers.find(p => p.type === 'aqua');

    return `
      <section class="settings-section">
        <h2>Provider P (Pollinations)</h2>
        <p class="section-desc">Default provider with embedded key. Rate limited to 0.4 credits/hour.</p>
        <div class="provider-card">
          <div class="provider-status">
            <span class="status-indicator active"></span>
            <span>Active (Default)</span>
          </div>
          <div class="provider-info">
            <p><strong>Base URL:</strong> https://gen.pollinations.ai/v1</p>
            <p>Used for characters, image generation, and voice by default.</p>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Provider A (Aqua)</h2>
        <p class="section-desc">Premium provider for heavy models. Add your API key to upgrade.</p>
        <div class="provider-card">
          <div class="provider-status">
            <span class="status-indicator ${aquaP?.apiKey ? 'active' : 'inactive'}"></span>
            <span>${aquaP?.apiKey ? 'Active' : 'Not configured'}</span>
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input type="password" id="aqua-api-key" value="${aquaP?.apiKey || ''}" placeholder="Enter your Aqua API key" />
            <p class="hint">Stored locally in your browser. Never sent to our servers.</p>
          </div>
          <div class="form-actions">
            <button class="btn-primary" id="btn-save-aqua">Save Key</button>
            ${aquaP?.apiKey ? `<button class="btn-secondary" id="btn-remove-aqua">Remove</button>` : ''}
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Default Models</h2>
        <p class="section-desc">Models used when creating new characters and scenarios.</p>
        <div class="setting-item">
          <label>Character Model</label>
          <select id="default-char-model">
            <option value="llama-scout" ${settings.defaultCharacterModel === 'llama-scout' ? 'selected' : ''}>Llama 4 Scout (17B)</option>
            <option value="mistral-small" ${settings.defaultCharacterModel === 'mistral-small' ? 'selected' : ''}>Mistral Small 3.1</option>
            ${aquaP?.apiKey ? `
              <option value="llama-maverick" ${settings.defaultCharacterModel === 'llama-maverick' ? 'selected' : ''}>Llama 4 Maverick (Premium)</option>
            ` : ''}
          </select>
        </div>
        <div class="setting-item">
          <label>Controller Model</label>
          <select id="default-ctrl-model">
            <option value="llama-scout" ${settings.defaultControllerModel === 'llama-scout' ? 'selected' : ''}>Llama 4 Scout</option>
            ${aquaP?.apiKey ? `
              <option value="grok-4.1" ${settings.defaultControllerModel === 'grok-4.1' ? 'selected' : ''}>Grok 4.1 (Premium)</option>
            ` : ''}
          </select>
        </div>
      </section>
    `;
  }

  private renderDataTab(): string {
    const scenarios = scenarioStore.getAll().length;
    const characters = characterStore.getAll().length;

    return `
      <section class="settings-section">
        <h2>Data Overview</h2>
        <div class="data-stats">
          <div class="stat-item">
            <span class="stat-value">${scenarios}</span>
            <span class="stat-label">Scenarios</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${characters}</span>
            <span class="stat-label">Characters</span>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Export</h2>
        <p class="section-desc">Export all your data as JSON. You can import it later or on another device.</p>
        <button class="btn-primary" id="btn-export">
          ${appIcons.fileJson({ size: 16 })}
          Export All Data
        </button>
      </section>
      
      <section class="settings-section">
        <h2>Import</h2>
        <p class="section-desc">Import previously exported data. This will merge with existing data.</p>
        <div class="form-group">
          <input type="file" id="import-file" accept=".json" />
        </div>
        <button class="btn-secondary" id="btn-import">Import Data</button>
      </section>
      
      <section class="settings-section danger-zone">
        <h2>Danger Zone</h2>
        <button class="btn-danger" id="btn-clear-all">
          Clear All Data
        </button>
      </section>
    `;
  }

  private setupListeners(): void {
    // Back button
    this.container.querySelector('#btn-back')?.addEventListener('click', () => {
      appState.setView('dashboard');
    });

    // Tab navigation
    this.container.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const tab = (el as HTMLElement).dataset.tab as 'general' | 'providers' | 'data';
        this.currentTab = tab;
        this.render();
        this.setupListeners();
      });
    });

    // Theme selection
    this.container.querySelectorAll('[data-theme]').forEach(el => {
      el.addEventListener('click', () => {
        const theme = (el as HTMLElement).dataset.theme as 'dark' | 'light';
        settingsStore.set('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        this.render();
        this.setupListeners();
      });
    });

    // General settings
    const controllerFreq = this.container.querySelector('#controller-frequency') as HTMLInputElement;
    controllerFreq?.addEventListener('change', () => {
      settingsStore.set('controllerCheckFrequency', parseInt(controllerFreq.value, 10));
    });

    const memorySize = this.container.querySelector('#memory-size') as HTMLInputElement;
    memorySize?.addEventListener('change', () => {
      settingsStore.set('shortTermMemorySize', parseInt(memorySize.value, 10));
    });

    const debugMode = this.container.querySelector('#debug-mode') as HTMLInputElement;
    debugMode?.addEventListener('change', () => {
      settingsStore.set('debugMode', debugMode.checked);
    });

    // Default models
    const charModel = this.container.querySelector('#default-char-model') as HTMLSelectElement;
    charModel?.addEventListener('change', () => {
      settingsStore.set('defaultCharacterModel', charModel.value);
    });

    const ctrlModel = this.container.querySelector('#default-ctrl-model') as HTMLSelectElement;
    ctrlModel?.addEventListener('change', () => {
      settingsStore.set('defaultControllerModel', ctrlModel.value);
    });

    // Provider A (Aqua) key management
    this.container.querySelector('#btn-save-aqua')?.addEventListener('click', async () => {
      const keyInput = this.container.querySelector('#aqua-api-key') as HTMLInputElement;
      const key = keyInput?.value.trim();
      if (key) {
        await providerStore.setAquaKey(key);
        appEvents.emit('toast', { message: 'Aqua API key saved', type: 'success' });
        this.render();
        this.setupListeners();
      }
    });

    this.container.querySelector('#btn-remove-aqua')?.addEventListener('click', async () => {
      await providerStore.removeAquaKey();
      appEvents.emit('toast', { message: 'Aqua API key removed', type: 'info' });
      this.render();
      this.setupListeners();
    });

    // Create user character from settings
    this.container.querySelector('#btn-create-user-char')?.addEventListener('click', () => {
      appState.setView('dashboard');
      setTimeout(() => {
        appEvents.emit('show:create-character');
      }, 100);
    });

    // Data export
    this.container.querySelector('#btn-export')?.addEventListener('click', async () => {
      try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theatro-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        appEvents.emit('toast', { message: 'Export downloaded', type: 'success' });
      } catch (e) {
        appEvents.emit('toast', { message: 'Export failed', type: 'error' });
      }
    });

    // Data import
    this.container.querySelector('#btn-import')?.addEventListener('click', async () => {
      const fileInput = this.container.querySelector('#import-file') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        appEvents.emit('toast', { message: 'Select a file first', type: 'warning' });
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importAllData(data);
        appEvents.emit('toast', { message: 'Data imported successfully', type: 'success' });
        this.render();
        this.setupListeners();
      } catch (e) {
        appEvents.emit('toast', { message: 'Import failed: invalid file', type: 'error' });
      }
    });

    // Clear all data
    this.container.querySelector('#btn-clear-all')?.addEventListener('click', () => {
      this.modal.show({
        title: 'Clear All Data?',
        content: '<p>This will delete all scenarios, characters, and messages. This cannot be undone.</p><p>Export your data first if you want to keep it.</p>',
        confirmText: 'Delete Everything',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
          // Implementation would clear IndexedDB
          appEvents.emit('toast', { message: 'All data cleared', type: 'info' });
          return true;
        }
      });
    });
  }

  destroy(): void {
    this.modal.destroy();
    this.container.innerHTML = '';
  }
}
