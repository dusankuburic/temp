import { Injectable, ComponentRef } from '@angular/core';
import { BsModalService, BsModalRef, ModalOptions } from 'ngx-bootstrap/modal';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ModalConfig<T = any> {
  component: any;
  cssClass?: string;
  initialState?: T;
  onSave?: () => void;
  onClose?: () => void;
}

export interface ModalResult {
  isSaved: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalFactoryService {
  constructor(private bsModalService: BsModalService) {}

  /**
   * Opens a modal and handles the common pattern of listening to save events
   * @param config Modal configuration
   * @param destroy$ Observable to handle cleanup
   * @returns BsModalRef
   */
  open<T = any>(
    config: ModalConfig<T>,
    destroy$?: Observable<void>
  ): BsModalRef {
    const modalOptions: ModalOptions = {
      class: config.cssClass || 'modal-dialog-centered',
      initialState: config.initialState as unknown as Partial<any>
    };

    const modalRef = this.bsModalService.show(config.component, modalOptions);

    if (modalRef.onHidden && (config.onSave || config.onClose)) {
      // Accessing the EventEmitter as an Observable for pipe
      let hidden$: Observable<unknown> = modalRef.onHidden;

      if (destroy$) {
        hidden$ = hidden$.pipe(takeUntil(destroy$));
      }

      hidden$.subscribe(() => {
        const content = modalRef.content;

        if (content?.isSaved && config.onSave) {
          config.onSave();
        }

        if (config.onClose) {
          config.onClose();
        }
      });
    }

    return modalRef;
  }

  /**
   * Opens a modal and returns an observable that emits the result
   * @param config Modal configuration
   * @returns Observable<ModalResult>
   */
  openWithResult<T = any>(
    config: ModalConfig<T>
  ): Observable<ModalResult> {
    const result$ = new Subject<ModalResult>();

    const modalOptions: ModalOptions = {
      class: config.cssClass || 'modal-dialog-centered',
      initialState: config.initialState as unknown as Partial<any>
    };

    const modalRef = this.bsModalService.show(config.component, modalOptions);

    if (modalRef.onHidden) {
      modalRef.onHidden.subscribe(() => {
        const content = modalRef.content;
        result$.next({
          isSaved: !!content?.isSaved,
          data: content?.data
        });
        result$.complete();
      });
    } else {
      result$.next({ isSaved: false });
      result$.complete();
    }

    return result$.asObservable();
  }

  /**
   * Opens a confirmation modal (can be extended for custom confirmation modals)
   * @param message Confirmation message
   * @param onConfirm Callback when confirmed
   * @param onCancel Callback when cancelled
   */
  confirm(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    // This would require a confirmation modal component
    // For now, using native confirm as fallback
    if (confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  }
}
