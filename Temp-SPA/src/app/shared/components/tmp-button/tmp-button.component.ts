import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'transparent' | 'success' | 'danger' | 'warning' | 'info';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'tmp-button',
  templateUrl: './tmp-button.component.html',
  styleUrls: ['./tmp-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TmpButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() fullWidth = false;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() ariaLabel?: string;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      'tmp-button',
      `tmp-button-${this.variant}`,
      `tmp-button-${this.size}`,
    ];

    if (this.fullWidth) {
      classes.push('tmp-button-full-width');
    }

    if (this.loading) {
      classes.push('tmp-button-loading');
    }

    if (this.icon && !this.hasContent()) {
      classes.push('tmp-button-icon-only');
    }

    return classes.join(' ');
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }

  private hasContent(): boolean {
    
    return true; 
  }
}
