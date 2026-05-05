import { scenarioStore, characterStore, appState, appEvents } from '../stores/index.js';
import { appIcons } from '../assets/icons/index.js';

export class SidePanel {
  private container: HTMLElement;
  private scenario: any;
  private isOpen = false;

  constructor(container: HTMLElement, scenario: any) {
    this.container = container;
    this.scenario = scenario;
    this.render();
    this.setupListeners();

    appEvents.on('sidepanel:changed', ({ isOpen }) => {
      this.isOpen = isOpen;
      this.updateVisibility();
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="side-panel">
        <div class="panel-header">
          <h3>Director Console</h3>
          <button class="btn-close" id="panel-close">${appIcons.close({ size: 20 })}</button>
        </div>
        <nav class="panel-tabs">
          <button class="tab-btn active" data-tab="next">${appIcons.target({ size: 16 })} Next</button>
          <button class="tab-btn" data-tab="details">${appIcons.document({ size: 16 })} Details</button>
          <button class="tab-btn" data-tab="matrix">${appIcons.network({ size: 16 })} Relations</button>
          <button class="tab-btn" data-tab="memory">${appIcons.brain({ size: 16 })} Memory</button>
          <button class="tab-btn" data-tab="characters">${appIcons.users({ size: 16 })} Cast</button>
          <button class="tab-btn" data-tab="debug">${appIcons.bug({ size: 16 })} Debug</button>
        </nav>
        <div class="panel-content" id="panel-content">
          <div class="tab-content active" data-tab="next">
            <div class="form-group">
              <label>What Should Happen Next</label>
              <textarea id="directive-next" rows="4" placeholder="Direct the story..."></textarea>
            </div>
            <div class="form-group">
              <label>Brief Details</label>
              <textarea id="directive-details" rows="3" placeholder="Style notes, tone, constraints..."></textarea>
            </div>
            <button class="btn-primary" id="btn-send-directive">Send to Controllers</button>
          </div>
          <div class="tab-content" data-tab="details">
            <h4>Scenario</h4>
            <p class="scenario-name">${this.scenario.name}</p>
            <h4>Lore</h4>
            <p class="scenario-lore">${this.scenario.lore}</p>
            <h4>Settings</h4>
            <ul class="settings-list">
              <li>AI knows user: ${this.scenario.settings.aiKnowsUser ? 'Yes' : 'No'}</li>
              <li>Auto scenario: ${this.scenario.settings.autoScenario ? 'On' : 'Off'}</li>
            </ul>
          </div>
          <div class="tab-content" data-tab="matrix">
            <p class="hint">Relationship matrix loads dynamically</p>
          </div>
          <div class="tab-content" data-tab="memory">
            <h4>Summary</h4>
            <p>${this.scenario.summary || 'No summary yet'}</p>
          </div>
          <div class="tab-content" data-tab="characters">
            <div class="character-list-compact">
              ${this.scenario.characterIds.map((id: string) => {
                const c = characterStore.get(id);
                return c ? `<div class="char-compact"><span class="char-dot" style="background: ${c.color}"></span>${c.name}</div>` : '';
              }).join('')}
            </div>
          </div>
          <div class="tab-content" data-tab="debug">
            <div class="debug-logs" id="debug-logs"></div>
          </div>
        </div>
      </div>
    `;
  }

  private setupListeners(): void {
    this.container.querySelector('#panel-close')?.addEventListener('click', () => appState.closeSidePanel());

    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).dataset.tab!;
        this.switchTab(tab);
      });
    });

    this.container.querySelector('#btn-send-directive')?.addEventListener('click', () => {
      const next = (this.container.querySelector('#directive-next') as HTMLTextAreaElement)?.value;
      const details = (this.container.querySelector('#directive-details') as HTMLTextAreaElement)?.value;
      appEvents.emit('directive:send', { next, details });
      appEvents.emit('toast', { message: 'Directive sent to controllers', type: 'success' });
    });
  }

  private switchTab(tab: string): void {
    this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    this.container.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    this.container.querySelectorAll(`.tab-content[data-tab="${tab}"]`).forEach(c => c.classList.add('active'));
  }

  private updateVisibility(): void {
    this.container.querySelector('.side-panel')?.classList.toggle('open', this.isOpen);
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
