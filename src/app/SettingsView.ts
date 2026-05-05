import { appState, appEvents, scenarioStore, characterStore } from '../stores/index.js';
import { appIcons } from '../assets/icons/index.js';
import { Modal } from './Modal.js';

export class SettingsView {
  private container: HTMLElement;
  private modal: Modal;

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
          <button class="btn-back" id="btn-back">${appIcons.arrowLeft({ size: 20 })}</button>
          <h1>Settings</h1>
        </header>
        
        <main class="settings-content">
          <section class="settings-section">
            <h2>Data Management</h2>
            <div class="settings-actions">
              <button class="btn-secondary" id="btn-export">
                ${appIcons.fileJson({ size: 16 })}
                Export All Data
              </button>
              <button class="btn-secondary" id="btn-import">
                ${appIcons.cloudUpload({ size: 16 })}
                Import Data
              </button>
            </div>
          </section>
          
          <section class="settings-section">
            <h2>Danger Zone</h2>
            <button class="btn-danger" id="btn-clear-all">
              ${appIcons.trash({ size: 16 })}
              Clear All Data
            </button>
          </section>
        </main>
      </div>
    `;
  }

  private setupListeners(): void {
    this.container.querySelector('#btn-back')?.addEventListener('click', () => {
      appState.setView('dashboard');
    });

    this.container.querySelector('#btn-export')?.addEventListener('click', async () => {
      try {
        const data = await scenarioStore.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theatro-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        appEvents.emit('toast', { message: 'Export downloaded', type: 'success' });
      } catch (e) {
        appEvents.emit('toast', { message: 'Export failed', type: 'error' });
      }
    });

    this.container.querySelector('#btn-import')?.addEventListener('click', () => {
      this.showImportModal();
    });

    this.container.querySelector('#btn-clear-all')?.addEventListener('click', () => {
      this.modal.show({
        title: 'Clear All Data?',
        content: '<p>This will delete all characters, scenarios, and messages. This cannot be undone.</p>',
        confirmText: 'Delete Everything',
        confirmClass: 'btn-danger',
        onConfirm: async () => {
          // Clear all data
          scenarioStore.clear();
          characterStore.clearCache();
          appEvents.emit('toast', { message: 'All data cleared', type: 'info' });
          appState.setView('dashboard');
        }
      });
    });
  }

  private showImportModal(): void {
    this.modal.show({
      title: 'Import Data',
      content: `
        <div class="form-group">
          <label>Paste your backup JSON:</label>
          <textarea id="import-data" rows="10" placeholder="Paste JSON here..."></textarea>
        </div>
      `,
      confirmText: 'Import',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        const text = (document.querySelector('#import-data') as HTMLTextAreaElement)?.value;
        if (!text) return false;

        try {
          const data = JSON.parse(text);
          const success = await scenarioStore.importAll(data);
          if (success) {
            appEvents.emit('toast', { message: 'Import successful', type: 'success' });
            appState.setView('dashboard');
          } else {
            appEvents.emit('toast', { message: 'Import failed', type: 'error' });
            return false;
          }
        } catch (e) {
          appEvents.emit('toast', { message: 'Invalid JSON', type: 'error' });
          return false;
        }
      }
    });
  }

  destroy(): void {
    this.modal.destroy();
    this.container.innerHTML = '';
  }
}
