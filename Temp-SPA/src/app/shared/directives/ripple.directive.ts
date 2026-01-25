import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[ripple]',
  standalone: false
})
export class RippleDirective {
  @Input() rippleColor: string = 'rgba(255, 255, 255, 0.3)';
  @Input() rippleDuration: number = 600;

  constructor(private element: ElementRef) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const button = this.element.nativeElement;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const circle = document.createElement('span');
    circle.classList.add('ripple-element');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x - radius}px`;
    circle.style.top = `${y - radius}px`;
    circle.style.backgroundColor = this.rippleColor;
    circle.style.animationDuration = `${this.rippleDuration}ms`;

    
    const existingRipple = button.querySelector('.ripple-element');
    if (existingRipple) {
      existingRipple.remove();
    }

    
    const buttonStyle = window.getComputedStyle(button);
    if (buttonStyle.position !== 'absolute' && buttonStyle.position !== 'relative') {
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
    }

    button.appendChild(circle);

    
    setTimeout(() => {
      circle.remove();
    }, this.rippleDuration);
  }
}
