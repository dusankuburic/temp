import { Directive, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ModalScrollService } from '../services/modal-scroll.service';


@Directive({
  selector: '[appModalScroll]'
})
export class ModalScrollDirective implements AfterViewInit, OnDestroy {
  private modalRef: BsModalRef | null = null;

  constructor(
    private modalService: BsModalService,
    private modalScrollService: ModalScrollService,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit(): void {
    
    this.setupModalWatchers();
  }

  ngOnDestroy(): void {
    if (this.modalRef) {
      this.modalRef.hide();
      this.modalRef = null;
    }
  }

  private setupModalWatchers(): void {
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (this.isModalNode(node as HTMLElement)) {
            this.handleModalShow();
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (this.isModalNode(node as HTMLElement)) {
            this.handleModalHide();
          }
        });
      });
    });

    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private isModalNode(node: HTMLElement): boolean {
    
    return node &&
           (node.classList?.contains('modal-backdrop') ||
            node.classList?.contains('modal') ||
            (node as HTMLElement).querySelector?.('.modal-backdrop'));
  }

  private handleModalShow(): void {
    
    setTimeout(() => {
      this.modalScrollService.lockScroll();
    }, 50);
  }

  private handleModalHide(): void {
    
    setTimeout(() => {
      this.modalScrollService.unlockScroll();
    }, 50);
  }
}
