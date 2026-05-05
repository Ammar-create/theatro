interface ModalOptions {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  confirmClass?: string;
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  onCancel?: () => void;
}

export class Modal {
  private overlay: HTMLElement | null = null;
  private active = false;

  show(options: ModalOptions): void {
    if (this.active) this.close();
    this.active = true;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>${options.title}</h3>
          <button class="btn-close-modal">×</button>
        </div>
        <div class="modal-body">
          ${options.content}
        </div>
        <div class="modal-footer">
          ${options.showCancel !== false ? `
            <button class="btn-cancel">${options.cancelText || 'Cancel'}</button>
          ` : ''}
          <button class="btn-confirm ${options.confirmClass || 'btn-primary'}">
            ${options.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';

    // Get elements
    const container = this.overlay.querySelector('.modal-container') as HTMLElement;
    const closeBtn = this.overlay.querySelector('.btn-close-modal');
    const cancelBtn = this.overlay.querySelector('.btn-cancel');
    const confirmBtn = this.overlay.querySelector('.btn-confirm');

    // Close handlers
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    cancelBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      options.onCancel?.();
      this.close();
    });

    confirmBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const result = await options.onConfirm?.();
      if (result !== false) this.close();
    });

    // Click outside to close - click on overlay (not container) closes
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.active) {
        this.close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus first input
    setTimeout(() => {
      const firstInput = this.overlay?.querySelector('input[type="text"], textarea') as HTMLElement;
      if (firstInput) firstInput.focus();
    }, 50);
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    document.body.style.overflow = '';
    this.active = false;
  }

  destroy(): void {
    this.close();
  }
}
