import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

@Component({
  selector: 'tmp-modal',
  templateUrl: './tmp-modal.component.html',
  styleUrls: ['./tmp-modal.component.scss'],
  standalone: false
})
export class TmpModalComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() size: ModalSize = 'medium';
  @Input() isOpen = false;
  @Input() closable = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showFooter = true;
  @Input() showHeader = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();

  isAnimating = false;

  ngOnInit(): void {
    if (this.isOpen) {
      this.open();
    }
  }

  ngOnDestroy(): void {
    this.removeBodyScrollLock();
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent): void {
    if (this.isOpen && this.closable && this.closeOnEscape) {
      event.preventDefault();
      this.close();
    }
  }

  open(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.isAnimating = true;
      this.addBodyScrollLock();
      this.isOpenChange.emit(this.isOpen);
      this.opened.emit();

      // Remove animation class after animation completes
      setTimeout(() => {
        this.isAnimating = false;
      }, 300);
    }
  }

  close(): void {
    if (this.isOpen && this.closable) {
      this.isAnimating = true;

      // Wait for close animation before removing modal
      setTimeout(() => {
        this.isOpen = false;
        this.isAnimating = false;
        this.removeBodyScrollLock();
        this.isOpenChange.emit(this.isOpen);
        this.closed.emit();
      }, 200);
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop && this.closable) {
      this.close();
    }
  }

  onDialogClick(event: Event): void {
    // Prevent click from bubbling to backdrop
    event.stopPropagation();
  }

  get modalClasses(): string {
    const classes = [
      'tmp-modal-dialog',
      `tmp-modal-${this.size}`
    ];

    return classes.join(' ');
  }

  private addBodyScrollLock(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  private removeBodyScrollLock(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
