import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { ControlValueAccessorDirective } from '../control-value-accessor.directive';

export interface SelectionOption {
  value: any,
  display: any,
  disabled?: boolean,
  hidden?: boolean
}

let nextUniqueId = 0;

@Component({
    selector: 'tmp-select',
    templateUrl: './tmp-select.component.html',
    styleUrl: './tmp-select.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TmpSelectComponent),
            multi: true,
        }
    ],
    standalone: false
})
export class TmpSelectComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() options: SelectionOption[] = [];
  @Input() label = '';
  @Input() isFilter: boolean = false;
  @Input() hint: string = '';

  isFocused = false;
  private uniqueId = `tmp-select-${++nextUniqueId}`;

  get selectId(): string {
    return this.uniqueId;
  }

  get errorId(): string {
    return `${this.uniqueId}-error`;
  }

  get hintId(): string {
    return `${this.uniqueId}-hint`;
  }

  get isFieldRequired(): boolean {
    if (!this.control?.validator) return false;
    const validator = this.control.validator({} as any);
    return !!(validator && validator['required'] === true);
  }

  get isLoading(): boolean {
    return this.control?.status === 'PENDING';
  }

  get hasError(): boolean {
    return !this.isFilter && !!(this.control?.touched && this.control?.invalid);
  }

  get isValid(): boolean {
    return !this.isFilter && !!(this.control?.touched && this.control?.valid);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
  }
}
