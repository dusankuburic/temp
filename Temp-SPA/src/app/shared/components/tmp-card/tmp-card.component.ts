import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CardVariant = 'filled' | 'outline' | 'subtle';
export type CardSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'tmp-card',
  templateUrl: './tmp-card.component.html',
  styleUrls: ['./tmp-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TmpCardComponent {
  @Input() variant: CardVariant = 'filled';
  @Input() size: CardSize = 'medium';
  @Input() hoverable = false;
  @Input() clickable = false;
  @Input() selected = false;
  @Input() hasHeader = false;
  @Input() hasFooter = false;

  get cardClasses(): string {
    const classes = [
      'tmp-card',
      `tmp-card-${this.variant}`,
      `tmp-card-${this.size}`,
    ];

    if (this.hoverable) {
      classes.push('tmp-card-hoverable');
    }

    if (this.clickable) {
      classes.push('tmp-card-clickable');
    }

    if (this.selected) {
      classes.push('tmp-card-selected');
    }

    return classes.join(' ');
  }
}
