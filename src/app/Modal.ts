// ===== MODAL SYSTEM =====

let activeModal: Modal | null = null;

export class Modal {
  private overlay: HTMLElement;
  private content: HTMLElement;
  private id: string;

  constructor(id: string) {
    this.id = id;
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.id = `modal-${id}`;
    
    this.content = document.createElement('div');
    this.content.className = 'modal-card';
    this.overlay.appendChild(this.content);

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  setContent(html: string): void {
    this.content.innerHTML = html;
  }

  getContainer(): HTMLElement {
    return this.content;
  }

  open(): void {
    if (activeModal) activeModal.close();
    activeModal = this;
    document.body.appendChild(this.overlay);
    
    // Bind close buttons
    this.content.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Animate in
    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
    });
  }

  close(): void {
    this.overlay.classList.remove('open');
    setTimeout(() => this.overlay.remove(), 200);
    if (activeModal === this) activeModal = null;
  }

  static alert(title: string, message: string): void {
    const modal = new Modal('alert');
    modal.setContent(`
      <div class="modal-body">
        <h3>${title}</h3>
        <p class="text-muted">${message}</p>
        <div class="modal-footer">
          <button class="btn btn-primary modal-close">OK</button>
        </div>
      </div>
    `);
    modal.open();
  }

  static confirm(title: string, message: string, onConfirm: () => void): void {
    const modal = new Modal('confirm');
    modal.setContent(`
      <div class="modal-body">
        <h3>${title}</h3>
        <p class="text-muted">${message}</p>
        <div class="modal-footer">
          <button class="btn btn-ghost modal-close">Cancel</button>
          <button class="btn btn-danger" id="modal-confirm-btn">Confirm</button>
        </div>
      </div>
    `);
    modal.getContainer().querySelector('#modal-confirm-btn')
      ?.addEventListener('click', () => {
        onConfirm();
        modal.close();
      });
    modal.open();
  }
}