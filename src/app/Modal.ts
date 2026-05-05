// ===== MODAL SYSTEM - NO NATIVE POPUPS =====
import { renderIcon, ICONS } from '../assets/icons/index.js';

export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  showFooter?: boolean;
  footerActions?: ModalAction[];
  onClose?: () => void;
  onConfirm?: () => void;
}

export interface ModalAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

class ModalSystem {
  private container: HTMLElement | null = null;
  private activeModal: HTMLElement | null = null;
  private backdrop: HTMLElement | null = null;
  private onCloseCallback: (() => void) | null = null;

  init() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'modal-container';
    this.container.className = 'modal-container';
    document.body.appendChild(this.container);

    // Close on backdrop click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });
  }

  open(options: ModalOptions): void {
    this.init();
    if (!this.container) return;

    this.onCloseCallback = options.onClose || null;

    // Create backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';

    // Create modal
    this.activeModal = document.createElement('div');
    this.activeModal.className = `modal modal-${options.size || 'md'}`;
    this.activeModal.setAttribute('role', 'dialog');
    this.activeModal.setAttribute('aria-modal', 'true');

    // Build content
    this.activeModal.innerHTML = this.buildModalHTML(options);

    // Assemble
    this.backdrop.appendChild(this.activeModal);
    this.container.appendChild(this.backdrop);

    // Trigger animation
    requestAnimationFrame(() => {
      this.backdrop?.classList.add('open');
      this.activeModal?.classList.add('open');
    });

    // Attach event handlers
    this.attachEventHandlers(options);

    // Focus trap
    this.trapFocus();
  }

  close(): void {
    if (!this.backdrop || !this.activeModal) return;

    this.backdrop.classList.remove('open');
    this.activeModal.classList.remove('open');

    setTimeout(() => {
      this.backdrop?.remove();
      this.backdrop = null;
      this.activeModal = null;
      this.onCloseCallback?.();
    }, 200);
  }

  private buildModalHTML(options: ModalOptions): string {
    const contentHTML = typeof options.content === 'string' 
      ? options.content 
      : '';

    const footerHTML = options.showFooter !== false ? `
      <div class="modal-footer">
        ${options.footerActions?.map(action => `
          <button class="btn btn-${action.variant || 'secondary'} ${action.loading ? 'loading' : ''}" 
                  data-action="${action.label}"
                  ${action.disabled ? 'disabled' : ''}>
            ${action.loading ? renderIcon(ICONS.loader, 14, 14) + ' ' : ''}
            ${action.label}
          </button>
        `).join('') || `
          <button class="btn btn-secondary" data-action="close">Cancel</button>
          <button class="btn btn-primary" data-action="confirm">Confirm</button>
        `}
      </div>
    ` : '';

    return `
      ${options.showClose !== false ? `
        <button class="modal-close" data-action="close" aria-label="Close">
          ${renderIcon(ICONS.x, 18, 18)}
        </button>
      ` : ''}
      <div class="modal-header">
        <h2 class="modal-title">${this.escapeHtml(options.title)}</h2>
      </div>
      <div class="modal-body">
        ${contentHTML}
      </div>
      ${footerHTML}
    `;
  }

  private attachEventHandlers(options: ModalOptions): void {
    if (!this.activeModal) return;

    // Close button
    this.activeModal.querySelectorAll('[data-action="close"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Confirm button
    this.activeModal.querySelectorAll('[data-action="confirm"]').forEach(btn => {
      btn.addEventListener('click', () => {
        options.onConfirm?.();
        this.close();
      });
    });

    // Custom actions
    options.footerActions?.forEach(action => {
      this.activeModal?.querySelector(`[data-action="${action.label}"]`)?.addEventListener('click', action.onClick);
    });
  }

  private trapFocus(): void {
    if (!this.activeModal) return;

    const focusable = this.activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length) {
      (focusable[0] as HTMLElement).focus();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const modal = new ModalSystem();

// ===== CHARACTER CREATION MODAL =====
export function openCharacterModal(onSave: (character: any) => void, editCharacter?: any): void {
  const isEdit = !!editCharacter;
  
  modal.open({
    title: isEdit ? 'Edit Character' : 'Create Character',
    size: 'lg',
    content: `
      <form class="character-form" id="character-form">
        <div class="form-grid">
          <div class="form-group form-group-full">
            <label class="form-label">Character Name *</label>
            <input type="text" class="form-input" id="char-name" 
                   value="${editCharacter?.name || ''}" required
                   placeholder="e.g., Aris Thorne, Captain Vex">
          </div>
          
          <div class="form-group">
            <label class="form-label">Character Color</label>
            <div class="color-picker" id="char-color-picker">
              ${['#ff9f43', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316']
                .map(color => `
                  <button type="button" class="color-option ${editCharacter?.color === color ? 'selected' : ''}"
                          style="background: ${color}" data-color="${color}"></button>
                `).join('')}
            </div>
            <input type="hidden" id="char-color" value="${editCharacter?.color || '#ff9f43'}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Model</label>
            <select class="form-select" id="char-model">
              <option value="llama-scout" ${editCharacter?.modelId === 'llama-scout' ? 'selected' : ''}>Llama 4 Scout</option>
              <option value="mistral" ${editCharacter?.modelId === 'mistral' ? 'selected' : ''}>Mistral Small</option>
              <option value="llama-4" ${editCharacter?.modelId === 'llama-4' ? 'selected' : ''}>Llama 4 Maverick</option>
            </select>
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Personality & Backstory *</label>
            <textarea class="form-textarea" id="char-personality" rows="6" required
                      placeholder="Describe their fears, desires, quirks, history, speech patterns...">${editCharacter?.personality || ''}</textarea>
            <span class="form-hint">This shapes how they respond in every interaction</span>
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Appearance</label>
            <textarea class="form-textarea" id="char-appearance" rows="4"
                      placeholder="Physical features, clothing style, distinguishing marks, how they move...">${editCharacter?.appearance || ''}</textarea>
            <span class="form-hint">Used for image generation and scene descriptions</span>
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Voice Description</label>
            <input type="text" class="form-input" id="char-voice" 
                   value="${editCharacter?.voiceDescription || ''}"
                   placeholder="e.g., Soft alto with slight rasp, formal but warm">
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Speech Patterns</label>
            <div class="tag-input" id="speech-patterns-input">
              ${editCharacter?.speechPatterns?.map((p: string) => `
                <span class="tag">${p} <button type="button" data-remove="${p}">×</button></span>
              `).join('') || ''}
              <input type="text" placeholder="Add pattern (press Enter)" id="speech-pattern-add">
            </div>
            <input type="hidden" id="char-speech-patterns" value="${editCharacter?.speechPatterns?.join(',') || ''}">
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Avatar</label>
            <div class="avatar-upload" id="avatar-upload">
              <div class="avatar-preview" id="avatar-preview">
                ${editCharacter?.avatar ? 
                  `<img src="${editCharacter.avatar}" alt="">` : 
                  `<span>${editCharacter?.name?.charAt(0).toUpperCase() || '?'}</span>`}
              </div>
              <div class="avatar-actions">
                <button type="button" class="btn btn-sm btn-secondary" id="upload-avatar-btn">
                  ${renderIcon(ICONS.upload, 14, 14)} Upload
                </button>
                <button type="button" class="btn btn-sm btn-outline" id="generate-avatar-btn">
                  ${renderIcon(ICONS.sparkles, 14, 14)} AI Generate
                </button>
              </div>
            </div>
          </div>
          
          ${!isEdit ? `
            <div class="form-group form-group-full">
              <label class="checkbox-label">
                <input type="checkbox" id="char-is-user">
                <span>This is my character (I will play as them)</span>
              </label>
            </div>
          ` : ''}
        </div>
      </form>
    `,
    footerActions: [
      {
        label: 'Cancel',
        variant: 'ghost',
        onClick: () => modal.close()
      },
      {
        label: isEdit ? 'Save Changes' : 'Create Character',
        variant: 'primary',
        onClick: () => {
          const form = document.getElementById('character-form') as HTMLFormElement;
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          
          const character = {
            id: editCharacter?.id,
            name: (document.getElementById('char-name') as HTMLInputElement).value,
            color: (document.getElementById('char-color') as HTMLInputElement).value,
            modelId: (document.getElementById('char-model') as HTMLSelectElement).value,
            personality: (document.getElementById('char-personality') as HTMLTextAreaElement).value,
            appearance: (document.getElementById('char-appearance') as HTMLTextAreaElement).value,
            voiceDescription: (document.getElementById('char-voice') as HTMLInputElement).value,
            speechPatterns: (document.getElementById('char-speech-patterns') as HTMLInputElement).value.split(',').filter(Boolean),
            avatar: editCharacter?.avatar || '',
            isUser: (document.getElementById('char-is-user') as HTMLInputElement)?.checked || false,
          };
          
          onSave(character);
          modal.close();
        }
      }
    ]
  });

  // Attach color picker handlers
  setTimeout(() => {
    document.querySelectorAll('#char-color-picker .color-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#char-color-picker .color-option').forEach(b => b.classList.remove('selected'));
        (e.currentTarget as HTMLElement).classList.add('selected');
        (document.getElementById('char-color') as HTMLInputElement).value = 
          (e.currentTarget as HTMLElement).dataset.color || '#ff9f43';
      });
    });
  }, 0);
}

// ===== SCENARIO CREATION MODAL =====
export function openScenarioModal(characters: any[], onSave: (scenario: any) => void): void {
  modal.open({
    title: 'Create New Scenario',
    size: 'lg',
    content: `
      <form class="scenario-form" id="scenario-form">
        <div class="form-grid">
          <div class="form-group form-group-full">
            <label class="form-label">Scenario Name *</label>
            <input type="text" class="form-input" id="scen-name" required
                   placeholder="e.g., Midnight at the Docks, The Forgotten Crypt">
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Setting & Lore *</label>
            <textarea class="form-textarea" id="scen-lore" rows="8" required
                      placeholder="Describe the world, time period, location, atmosphere. What the characters know about their situation..."
            ></textarea>
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Select Characters (${characters.length} available)</label>
            <div class="character-selection" id="char-selection">
              ${characters.map(c => `
                <label class="char-checkbox">
                  <input type="checkbox" value="${c.id}" data-char-id="${c.id}">
                  <div class="char-card-mini" style="border-color: ${c.color}40">
                    <div class="char-avatar-mini" style="background: ${c.color}20; color: ${c.color}">
                      ${c.avatar ? `<img src="${c.avatar}" alt="">` : c.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="char-info-mini">
                      <span class="char-name-mini" style="color: ${c.color}">${c.name}</span>
                      <span class="char-desc-mini">${c.personality.slice(0, 60)}...</span>
                    </div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>
          
          <div class="form-group form-group-full">
            <label class="form-label">Settings</label>
            <div class="settings-grid">
              <label class="checkbox-label">
                <input type="checkbox" id="scen-ai-knows-user">
                <span>AI knows real user (characters treat user as special)</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="scen-auto-image" checked>
                <span>Auto-generate images for key moments</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="scen-auto-scenario">
                <span>Start in Auto-Scenario mode</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Controller Check Interval</label>
            <select class="form-select" id="scen-interval">
              <option value="5">Every 5 messages</option>
              <option value="10" selected>Every 10 messages</option>
              <option value="15">Every 15 messages</option>
              <option value="20">Every 20 messages</option>
            </select>
          </div>
        </div>
      </form>
    `,
    footerActions: [
      {
        label: 'Cancel',
        variant: 'ghost',
        onClick: () => modal.close()
      },
      {
        label: 'Create Scenario',
        variant: 'primary',
        onClick: () => {
          const form = document.getElementById('scenario-form') as HTMLFormElement;
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }
          
          const selectedChars = Array.from(
            document.querySelectorAll('#char-selection input:checked')
          ).map(input => (input as HTMLInputElement).value);
          
          if (selectedChars.length < 1) {
            alert('Select at least one character');
            return;
          }
          
          const scenario = {
            name: (document.getElementById('scen-name') as HTMLInputElement).value,
            lore: (document.getElementById('scen-lore') as HTMLTextAreaElement).value,
            characterIds: selectedChars,
            settings: {
              aiKnowsUser: (document.getElementById('scen-ai-knows-user') as HTMLInputElement).checked,
              autoImageGen: (document.getElementById('scen-auto-image') as HTMLInputElement).checked,
              autoScenario: (document.getElementById('scen-auto-scenario') as HTMLInputElement).checked,
              controllerInterval: parseInt((document.getElementById('scen-interval') as HTMLSelectElement).value),
            }
          };
          
          onSave(scenario);
          modal.close();
        }
      }
    ]
  });
}
