import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeVariant = 'filled' | 'outline' | 'subtle' | 'tint';
export type BadgeColor = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'tmp-badge',
  templateUrl: './tmp-badge.component.html',
  styleUrls: ['./tmp-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TmpBadgeComponent {
  @Input() variant: BadgeVariant = 'filled';
  @Input() color: BadgeColor = 'brand';
  @Input() size: BadgeSize = 'medium';
  @Input() rounded = false;
  @Input() dot = false;

  get badgeClasses(): string {
    const classes = [
      'tmp-badge',
      `tmp-badge-${this.variant}`,
      `tmp-badge-${this.color}`,
      `tmp-badge-${this.size}`,
    ];

    if (this.rounded) {
      classes.push('tmp-badge-rounded');
    }

    if (this.dot) {
      classes.push('tmp-badge-dot');
    }

    return classes.join(' ');
  }
}
