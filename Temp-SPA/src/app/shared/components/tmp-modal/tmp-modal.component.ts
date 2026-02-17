import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

@Component({
  selector: 'tmp-modal',
  templateUrl: './tmp-modal.component.html',
  styleUrls: ['./tmp-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  isClosing = false;
  private animationTimeout?: number;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.open();
    }
  }

  ngOnDestroy(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
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
      this.cdr.markForCheck();

      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
      }

      this.animationTimeout = window.setTimeout(() => {
        this.isAnimating = false;
        this.animationTimeout = undefined;
        this.cdr.markForCheck();
      }, 150);
    }
  }

  close(): void {
    if (this.isOpen && this.closable) {
      this.isClosing = true;
      this.isAnimating = true;
      this.cdr.markForCheck();

      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
      }

      this.animationTimeout = window.setTimeout(() => {
        this.removeBodyScrollLock();
        this.isOpen = false;
        this.isOpenChange.emit(this.isOpen);
        this.closed.emit();
        this.isClosing = false;
        this.isAnimating = false;
        this.animationTimeout = undefined;
        this.cdr.markForCheck();
      }, 150);
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop && this.closable) {
      this.close();
    }
  }

  onDialogClick(event: Event): void {
    
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
      document.body.classList.add('modal-open');
    }
  }

  private removeBodyScrollLock(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }
}
