import { Injectable, Inject, PLATFORM_ID, NgZone, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class ModalFixService implements OnDestroy {
  private observer: MutationObserver | null = null;
  private modalCount = 0;
  private originalBodyStyles: { overflow?: string; paddingRight?: string } = {};
  private cleanupTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private zone: NgZone
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.setupModalObserver();
    }
  }


  private setupModalObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      this.zone.runOutsideAngular(() => {
        mutations.forEach((mutation) => {
          
          mutation.addedNodes.forEach((node) => {
            if (this.isModalBackdrop(node as HTMLElement)) {
              this.onModalOpen();
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (this.isModalBackdrop(node as HTMLElement)) {
              this.onModalClose();
            }
          });
        });
      });
    });

    
    this.observer.observe(document.body, {
      childList: true,
      subtree: false
    });
  }

  
  private isModalBackdrop(node: HTMLElement): boolean {
    return node && (node as HTMLElement).classList?.contains('modal-backdrop');
  }

  
  private onModalOpen(): void {
    if (this.modalCount === 0) {
      
      this.originalBodyStyles = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight
      };

      
      document.body.classList.remove('modal-closing');
    }

    this.modalCount++;

    
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          
          document.body.style.transform = 'translateZ(0)';
          document.body.style.willChange = 'transform';

          
          document.body.classList.add('modal-opening');

          
          setTimeout(() => {
            
            Object.assign(document.body.style, {
              overflow: 'hidden !important',
              paddingRight: '0px !important'
            });

            
            document.body.classList.add('modal-open');
            document.body.classList.remove('modal-opening');

            
            setTimeout(() => {
              document.body.style.transform = '';
              document.body.style.willChange = '';
            }, 150);
          }, 30);
        });
      });
    });
  }

  
  private onModalClose(): void {
    if (this.modalCount > 0) {
      this.modalCount--;
    }

    
    if (this.modalCount === 0) {
      this.zone.runOutsideAngular(() => {
        
        document.body.style.transform = 'translateZ(0)';
        document.body.style.willChange = 'transform, overflow';

        
        document.body.classList.add('modal-closing');
        document.body.classList.remove('modal-open');

        
        setTimeout(() => {
          
          if (this.originalBodyStyles.overflow) {
            document.body.style.overflow = this.originalBodyStyles.overflow;
          } else {
            document.body.style.overflow = '';
          }

          if (this.originalBodyStyles.paddingRight) {
            document.body.style.paddingRight = this.originalBodyStyles.paddingRight;
          } else {
            document.body.style.paddingRight = '';
          }

          
          document.body.classList.remove('modal-closing');

          
          setTimeout(() => {
            document.body.style.transform = '';
            document.body.style.willChange = '';
          }, 50);
        }, 150);
      });
    }
  }

  
  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
  }
}
