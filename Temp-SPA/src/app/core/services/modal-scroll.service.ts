import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class ModalScrollService {
  private scrollLockCount = 0;
  private originalBodyOverflow = '';
  private originalBodyPaddingRight = '';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  
  lockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const body = document.body;

    
    if (this.scrollLockCount === 0) {
      this.originalBodyOverflow = body.style.overflow;
      this.originalBodyPaddingRight = body.style.paddingRight;

      
      body.classList.add('modal-open', 'modal-opening');
    }

    this.scrollLockCount++;

    
    setTimeout(() => {
      body.classList.remove('modal-opening');
    }, 300);
  }

  
  unlockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.scrollLockCount > 0) {
      this.scrollLockCount--;
    }

    const body = document.body;

    
    if (this.scrollLockCount === 0) {
      
      body.classList.add('modal-closing');

      
      setTimeout(() => {
        body.classList.remove('modal-open', 'modal-closing');

        
        if (this.originalBodyOverflow) {
          body.style.overflow = this.originalBodyOverflow;
        } else {
          body.style.overflow = '';
        }

        if (this.originalBodyPaddingRight) {
          body.style.paddingRight = this.originalBodyPaddingRight;
        } else {
          body.style.paddingRight = '';
        }

        
        this.originalBodyOverflow = '';
        this.originalBodyPaddingRight = '';
      }, 300);
    }
  }

  
  isScrollLocked(): boolean {
    return this.scrollLockCount > 0;
  }
}
