import { Component, Input, forwardRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { ControlValueAccessorDirective } from '../control-value-accessor.directive';
import { faCheck, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

let nextUniqueId = 0;

@Component({
    selector: 'tmp-textarea',
    templateUrl: './tmp-textarea.component.html',
    styleUrl: './tmp-textarea.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TmpTextareaComponent),
            multi: true
        }
    ],
    standalone: false
})
export class TmpTextareaComponent<T> extends ControlValueAccessorDirective<T> implements AfterViewInit {
  @Input() placeholder = '';
  @Input() label = '';
  @Input() rows = 4;
  @Input() cols: number | null = null;
  @Input() maxLength: number | null = null;
  @Input() hint: string = '';
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  isFocused = false;
  private uniqueId = `tmp-textarea-${++nextUniqueId}`;

  ngAfterViewInit(): void {
    this.autoResize();
  }

  get textareaId(): string {
    return this.uniqueId;
  }

  get errorId(): string {
    return `${this.uniqueId}-error`;
  }

  get hintId(): string {
    return `${this.uniqueId}-hint`;
  }

  get charCountId(): string {
    return `${this.uniqueId}-char-count`;
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
    return !!(this.control?.touched && this.control?.invalid);
  }

  get isValid(): boolean {
    return !!(this.control?.touched && this.control?.valid);
  }

  get characterCount(): number {
    return this.control?.value?.length || 0;
  }

  get characterCountDisplay(): string {
    return `${this.characterCount}${this.maxLength ? '/' + this.maxLength : ''}`;
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
  }

  onInput(): void {
    this.autoResize();
  }

  private autoResize(): void {
    if (!this.textarea?.nativeElement) return;
    const element = this.textarea.nativeElement;
    element.style.height = 'auto';
    const newHeight = Math.max(element.scrollHeight, this.rows * 24); // Assuming ~24px per row
    element.style.height = newHeight + 'px';
  }

  // Icons
  protected readonly faCheck = faCheck;
  protected readonly faExclamationCircle = faExclamationCircle;
  protected readonly faSpinner = faSpinner;
}
