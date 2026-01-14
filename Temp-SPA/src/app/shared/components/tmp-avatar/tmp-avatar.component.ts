import { Component, Input } from '@angular/core';

@Component({
  selector: 'tmp-avatar',
  templateUrl: './tmp-avatar.component.html',
  styleUrls: ['./tmp-avatar.component.scss'],
  standalone: false
})
export class TmpAvatarComponent {
  @Input() profilePictureUrl?: string;
  @Input() displayName?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() shape: 'circle' | 'square' = 'circle';

  imageError = false;

  get initials(): string {
    if (!this.displayName) return '?';
    const parts = this.displayName.split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return this.displayName.substring(0, Math.min(2, this.displayName.length)).toUpperCase();
  }

  get sizeClass(): string {
    return `avatar-${this.size}`;
  }

  get shapeClass(): string {
    return `avatar-${this.shape}`;
  }

  onImageError(): void {
    this.imageError = true;
  }
}
