// ===== SIDE PANEL - Director's Console =====
import type { Scenario, RelationshipMatrix } from '../types/index.js';
import { scenarioStore, characterStore, appEvents } from '../stores/index.js';
import { renderIcon, ICONS, characterColorStyle } from '../assets/icons/index.js';

export class SidePanel {
  private container: HTMLElement;
  private scenario: Scenario;
  private isOpen = false;
  private activeTab: 'next' | 'details' | 'matrix' | 'memory' | 'debug' | 'scene' = 'next';

  constructor(container: HTMLElement, scenario: Scenario) {
    this.container = container;
    this.scenario = scenario;
    this.render();
    this.attachEventHandlers();
  }

  destroy() {
    // Cleanup if needed
  }

  setOpen(open: boolean) {
    this.isOpen = open;
    this.container.querySelector('.side-panel')?.classList.toggle('open', open);
  }

  private render() {
    this.container.innerHTML = `
      <aside class="side-panel ${this.isOpen ? 'open' : ''}">
        <div class="panel-header">
          <div class="panel-title-group">
            ${renderIcon(ICONS.cpu, 18, 18, 'var(--accent-amber)')}
            <h2 class="panel-title">Director's Console</h2>
          </div>
        </div>
        <div class="panel-tabs">
          ${this.renderTab('next', ICONS.play, 'What Next')}
          ${this.renderTab('details', ICONS.messageSquare, 'Details')}
          ${this.renderTab('matrix', ICONS.users, 'Matrix')}
          ${this.renderTab('memory', ICONS.brain, 'Memory')}
          ${this.renderTab('debug', ICONS.bug, 'Debug')}
          ${this.renderTab('scene', ICONS.scenario, 'Scene')}
        </div>
        <div class="panel-content" id="panel-content">
          ${this.renderPanelContent()}
        </div>
      </aside>
    `;
  }

  private renderTab(tab: string, icon: any, label: string): string {
    const isActive = this.activeTab === tab;
    return `
      <button class="panel-tab ${isActive ? 'active' : ''}" data-tab="${tab}">
        ${renderIcon(icon, 16, 16, isActive ? 'var(--accent-amber)' : 'var(--text-muted)')}
        <span>${label}</span>
      </button>
    `;
  }

  private renderPanelContent(): string {
    switch (this.activeTab) {
      case 'next': return this.renderWhatNextTab();
      case 'details': return this.renderBriefDetailsTab();
      case 'matrix': return this.renderMatrixTab();
      case 'memory': return this.renderMemoryTab();
      case 'debug': return this.renderDebugTab();
      case 'scene': return this.renderSceneTab();
      default: return '';
    }
  }

  private renderWhatNextTab(): string {
    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">What Should Happen Next</label>
          <span class="section-badge">Controller Input</span>
        </div>
        <p class="panel-description">Direct the story arc. The controllers will weave this into the narrative.</p>
        <textarea 
          class="form-textarea" 
          id="what-next-input"
          rows="8"
          placeholder="e.g., Character A discovers a secret about Character B. Tension rises. The user should feel conflicted about who to trust..."
        >${this.scenario.settings.whatNext || ''}</textarea>
        <button class="btn btn-primary btn-sm panel-action-btn" id="save-next-btn">
          ${renderIcon(ICONS.check, 14, 14)}
          <span>Update Direction</span>
        </button>
      </div>
      <div class="panel-section">
        <label class="form-label">Story Arc Progress</label>
        <div class="progress-indicator">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 35%"></div>
          </div>
          <span class="progress-text">Act 1 — Rising Tension</span>
        </div>
      </div>
    `;
  }

  private renderBriefDetailsTab(): string {
    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">Brief Details</label>
          <span class="section-badge">Persistent Notes</span>
        </div>
        <p class="panel-description">Style notes, reminders, and constraints for all controllers.</p>
        <textarea 
          class="form-textarea mono" 
          id="brief-details-input"
          rows="10"
          placeholder="Writing style: cinematic, dialogue-heavy
Emoji usage: minimal
Avoid: explicit violence, modern slang
Tone: melancholic, mysterious
Remember: Character A has a limp from Act 1 injury"
        >${this.scenario.settings.briefDetails || ''}</textarea>
        <button class="btn btn-primary btn-sm panel-action-btn" id="save-details-btn">
          ${renderIcon(ICONS.save, 14, 14)}
          <span>Save Notes</span>
        </button>
      </div>
    `;
  }

  private renderMatrixTab(): string {
    const chars = this.scenario.characterIds.map(id => characterStore.get(id)).filter(Boolean);
    if (chars.length === 0) {
      return '<div class="panel-empty"><p>No characters in this scenario.</p></div>';
    }

    // Build relationship matrix grid
    let gridHTML = '<div class="relationship-grid">';
    
    // Header row
    gridHTML += '<div class="matrix-row matrix-header-row">';
    gridHTML += '<div class="matrix-cell matrix-corner"></div>';
    chars.forEach(c => {
      gridHTML += `<div class="matrix-cell matrix-header" style="color: ${c!.color}" title="${c!.name}">${c!.name.slice(0, 2).toUpperCase()}</div>`;
    });
    gridHTML += '</div>';

    // Data rows
    chars.forEach(fromChar => {
      gridHTML += '<div class="matrix-row">';
      gridHTML += `<div class="matrix-cell matrix-header" style="color: ${fromChar!.color}" title="${fromChar!.name}">${fromChar!.name.slice(0, 2).toUpperCase()}</div>`;
      
      chars.forEach(toChar => {
        if (fromChar!.id === toChar!.id) {
          gridHTML += `<div class="matrix-cell matrix-self">—</div>`;
        } else {
          // Get relationship from matrix
          const relation = this.scenario.relationshipMatrix?.[fromChar!.id]?.[toChar!.id];
          const mood = relation?.mood || 'neutral';
          const intensity = relation?.intensity || 0;
          const color = this.getMoodColor(mood);
          
          gridHTML += `
            <div class="matrix-cell matrix-data" 
                 style="background: ${color}20; color: ${color}; border-color: ${color}40"
                 title="${relation?.reason || 'Neutral'}">
              <span class="mood-indicator" style="background: ${color}"></span>
              <span class="mood-label">${mood.slice(0, 3).toUpperCase()}</span>
            </div>
          `;
        }
      });
      gridHTML += '</div>';
    });
    
    gridHTML += '</div>';

    // Legend
    const moods = [
      { label: 'Friendly', color: '#10b981' },
      { label: 'Hostile', color: '#ef4444' },
      { label: 'Attracted', color: '#f472b6' },
      { label: 'Suspicious', color: '#f59e0b' },
      { label: 'Neutral', color: '#6b7280' },
    ];

    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">Relationship Matrix</label>
          <button class="btn btn-sm btn-outline" id="refresh-matrix-btn">
            ${renderIcon(ICONS.refreshCw, 12, 12)}
          </button>
        </div>
        <p class="panel-description">How characters feel about each other. Updated by the Main Controller.</p>
        ${gridHTML}
        <div class="matrix-legend">
          ${moods.map(m => `
            <div class="legend-item">
              <span class="legend-dot" style="background: ${m.color}"></span>
              <span class="legend-label">${m.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderMemoryTab(): string {
    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">Memory Summary</label>
          <span class="section-badge">Controller Maintained</span>
        </div>
        <p class="panel-description">Long-term summary of events. Each character has private memory too.</p>
        <div class="memory-box">
          ${this.scenario.summary ? `
            <div class="memory-content">
              ${this.scenario.summary.split('\n').map(line => `<p>${this.escapeHtml(line)}</p>`).join('')}
            </div>
          ` : `
            <div class="panel-empty">
              ${renderIcon(ICONS.brain, 32, 32, 'var(--text-muted)')}
              <p>No summary yet. The Main Controller will generate one after sufficient interaction.</p>
            </div>
          `}
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">Edit Summary</label>
        <textarea 
          class="form-textarea" 
          id="summary-input"
          rows="6"
          placeholder="Manually edit the scenario summary..."
        >${this.scenario.summary || ''}</textarea>
        <button class="btn btn-outline btn-sm panel-action-btn" id="save-summary-btn">
          ${renderIcon(ICONS.save, 14, 14)}
          <span>Update Summary</span>
        </button>
      </div>
    `;
  }

  private renderDebugTab(): string {
    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">Controller Stream</label>
          <span class="status-indicator active">Live</span>
        </div>
        <p class="panel-description">Live view of controller directives and decisions.</p>
        <div class="debug-stream" id="debug-stream">
          <div class="debug-entry system">
            <span class="debug-timestamp">System</span>
            <span class="debug-message">Waiting for controller activity...</span>
          </div>
        </div>
        <div class="debug-controls">
          <button class="btn btn-sm btn-outline" id="clear-debug-btn">
            ${renderIcon(ICONS.trash, 12, 12)}
            <span>Clear</span>
          </button>
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">System Events</label>
        <div class="event-log" id="event-log">
          <div class="event-entry">
            <span class="event-time">12:34</span>
            <span class="event-type">controller</span>
            <span class="event-desc">Main Controller checked — 10 messages</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderSceneTab(): string {
    const chars = this.scenario.characterIds.map(id => characterStore.get(id)).filter(Boolean);
    
    const charList = chars.map(c => `
      <div class="scene-character">
        <div class="scene-avatar" style="background: ${c!.color}20; color: ${c!.color}; border-color: ${c!.color}40">
          ${c!.avatar ? `<img src="${c!.avatar}" alt="${c!.name}">` : c!.name.charAt(0).toUpperCase()}
        </div>
        <div class="scene-info">
          <span class="scene-name" style="color: ${c!.color}">${this.escapeHtml(c!.name)}</span>
          <span class="scene-model">${c!.modelId || 'Default model'}</span>
        </div>
        <div class="scene-status">
          <span class="status-dot active"></span>
        </div>
      </div>
    `).join('');

    return `
      <div class="panel-section">
        <div class="section-header">
          <label class="form-label">Active Characters</label>
          <span class="section-badge">${chars.length} Active</span>
        </div>
        <div class="scene-characters-list">
          ${charList}
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">Scenario Settings</label>
        <div class="scene-settings">
          <div class="scene-setting">
            <div class="setting-info">
              <span class="setting-label">AI Knows Real User</span>
              <span class="setting-desc">Characters treat user as special</span>
            </div>
            <span class="setting-value toggle ${this.scenario.settings.aiKnowsUser ? 'active' : ''}">
              ${this.scenario.settings.aiKnowsUser ? 'Yes' : 'No'}
            </span>
          </div>
          <div class="scene-setting">
            <div class="setting-info">
              <span class="setting-label">Controller Interval</span>
              <span class="setting-desc">How often Main Controller runs</span>
            </div>
            <span class="setting-value">Every ${this.scenario.settings.controllerInterval || 10} messages</span>
          </div>
          <div class="scene-setting">
            <div class="setting-info">
              <span class="setting-label">Auto Image Gen</span>
              <span class="setting-desc">Generate images automatically</span>
            </div>
            <span class="setting-value toggle ${this.scenario.settings.autoImageGen ? 'active' : ''}">
              ${this.scenario.settings.autoImageGen ? 'Enabled' : 'Manual'}
            </span>
          </div>
        </div>
      </div>
      <div class="panel-section">
        <label class="form-label">Scene Lore</label>
        <div class="lore-box">
          <p>${this.escapeHtml(this.scenario.lore)}</p>
        </div>
      </div>
    `;
  }

  private getMoodColor(mood: string): string {
    const colors: Record<string, string> = {
      'friendly': '#10b981',
      'hostile': '#ef4444',
      'attracted': '#f472b6',
      'suspicious': '#f59e0b',
      'resentful': '#8b5cf6',
      'trust': '#3b82f6',
      'fear': '#6366f1',
      'neutral': '#6b7280',
    };
    return colors[mood] || '#6b7280';
  }

  private attachEventHandlers() {
    // Tab switching
    this.container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeTab = (e.currentTarget as HTMLElement).dataset.tab as any;
        this.render();
      });
    });

    // Save buttons
    this.container.querySelector('#save-next-btn')?.addEventListener('click', () => {
      const input = this.container.querySelector('#what-next-input') as HTMLTextAreaElement;
      if (input) {
        scenarioStore.update(this.scenario.id, {
          settings: { ...this.scenario.settings, whatNext: input.value }
        });
        appEvents.emit('toast', { message: 'Direction updated', type: 'success' });
      }
    });

    this.container.querySelector('#save-details-btn')?.addEventListener('click', () => {
      const input = this.container.querySelector('#brief-details-input') as HTMLTextAreaElement;
      if (input) {
        scenarioStore.update(this.scenario.id, {
          settings: { ...this.scenario.settings, briefDetails: input.value }
        });
        appEvents.emit('toast', { message: 'Notes saved', type: 'success' });
      }
    });

    this.container.querySelector('#save-summary-btn')?.addEventListener('click', () => {
      const input = this.container.querySelector('#summary-input') as HTMLTextAreaElement;
      if (input) {
        scenarioStore.update(this.scenario.id, { summary: input.value });
        appEvents.emit('toast', { message: 'Summary updated', type: 'success' });
      }
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
