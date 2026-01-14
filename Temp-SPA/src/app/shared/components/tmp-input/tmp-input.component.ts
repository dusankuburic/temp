import { Component, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { ControlValueAccessorDirective } from '../control-value-accessor.directive';
import { faCheck, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'time';

let nextUniqueId = 0;

@Component({
    selector: 'tmp-input',
    templateUrl: './tmp-input.component.html',
    styleUrl: './tmp-input.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TmpInputComponent),
            multi: true
        }
    ],
    standalone: false
})
export class TmpInputComponent<T> extends ControlValueAccessorDirective<T> {
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() isFilter: boolean = false;
  @Input() hint: string = '';

  isFocused = false;
  private uniqueId = `tmp-input-${++nextUniqueId}`;

  get inputId(): string {
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

  // Icons
  protected readonly faCheck = faCheck;
  protected readonly faExclamationCircle = faExclamationCircle;
  protected readonly faSpinner = faSpinner;
}
