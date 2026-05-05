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

    // Close handlers
    const closeBtn = this.overlay.querySelector('.btn-close-modal');
    const cancelBtn = this.overlay.querySelector('.btn-cancel');
    const confirmBtn = this.overlay.querySelector('.btn-confirm');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => {
      options.onCancel?.();
      this.close();
    });
    
    confirmBtn?.addEventListener('click', async () => {
      const result = await options.onConfirm?.();
      if (result !== false) this.close();
    });

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Focus trap
    const firstInput = this.overlay.querySelector('input, textarea');
    if (firstInput) (firstInput as HTMLElement).focus();
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
