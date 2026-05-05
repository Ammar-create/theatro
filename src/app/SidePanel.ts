import { characterStore, appState, appEvents } from '../stores/index.js';
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

    appEvents.on('sidepanel:changed', ({ isOpen }: { isOpen: boolean }) => {
      this.isOpen = isOpen;
      this.updateVisibility();
    });
  }

  private render(): void {
    this.container.innerHTML = '\n      <div class="side-panel">\n        <div class="panel-header">\n          <h3>Director Console</h3>\n          <button class="btn-close" id="panel-close">' + appIcons.close({ size: 20 }) + '</button>\n        </div>\n        <nav class="panel-tabs">\n          <button class="tab-btn active" data-tab="next">' + appIcons.target({ size: 16 }) + ' Next</button>\n          <button class="tab-btn" data-tab="details">' + appIcons.document({ size: 16 }) + ' Details</button>\n          <button class="tab-btn" data-tab="matrix">' + appIcons.network({ size: 16 }) + ' Relations</button>\n          <button class="tab-btn" data-tab="memory">' + appIcons.brain({ size: 16 }) + ' Memory</button>\n          <button class="tab-btn" data-tab="characters">' + appIcons.users({ size: 16 }) + ' Cast</button>\n          <button class="tab-btn" data-tab="debug">' + appIcons.bug({ size: 16 }) + ' Debug</button>\n        </nav>\n        <div class="panel-content" id="panel-content">\n          <div class="tab-content active" data-tab="next">\n            <div class="form-group">\n              <label>What Should Happen Next</label>\n              <textarea id="directive-next" rows="4" placeholder="Direct the story..."></textarea>\n            </div>\n            <div class="form-group">\n              <label>Brief Details</label>\n              <textarea id="directive-details" rows="3" placeholder="Style notes, tone, constraints..."></textarea>\n            </div>\n            <button class="btn-primary" id="btn-send-directive">Send to Controllers</button>\n          </div>\n          <div class="tab-content" data-tab="details">\n            <h4>Scenario</h4>\n            <p class="scenario-name">' + this.scenario.name + '</p>\n            <h4>Lore</h4>\n            <p class="scenario-lore">' + this.scenario.lore + '</p>\n            <h4>Settings</h4>\n            <ul class="settings-list">\n              <li>AI knows user: ' + (this.scenario.settings.aiKnowsUser ? 'Yes' : 'No') + '</li>\n              <li>Auto scenario: ' + (this.scenario.settings.autoScenario ? 'On' : 'Off') + '</li>\n            </ul>\n          </div>\n          <div class="tab-content" data-tab="matrix">\n            <p class="hint">Relationship matrix loads dynamically</p>\n          </div>\n          <div class="tab-content" data-tab="memory">\n            <h4>Summary</h4>\n            <p>' + (this.scenario.summary || 'No summary yet') + '</p>\n          </div>\n          <div class="tab-content" data-tab="characters">\n            <div class="character-list-compact">\n              ' + this.scenario.characterIds.map((id: string) => {
                const c = characterStore.get(id);
                return c ? '<div class="char-compact"><span class="char-dot" style="background: ' + c.color + '"></span>' + c.name + '</div>' : '';
              }).join('') + '\n            </div>\n          </div>\n          <div class="tab-content" data-tab="debug">\n            <div class="debug-logs" id="debug-logs"></div>\n          </div>\n        </div>\n      </div>\n    ';
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
    this.container.querySelector('[data-tab="' + tab + '"]')?.classList.add('active');
    this.container.querySelectorAll('.tab-content[data-tab="' + tab + '"]').forEach(c => c.classList.add('active'));
  }

  private updateVisibility(): void {
    this.container.querySelector('.side-panel')?.classList.toggle('open', this.isOpen);
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}