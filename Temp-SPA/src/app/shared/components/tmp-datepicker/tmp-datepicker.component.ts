import { ChangeDetectionStrategy, Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';


let nextUniqueId = 0;

@Component({
    selector: 'tmp-datepicker',
    templateUrl: './tmp-datepicker.component.html',
    styleUrl: './tmp-datepicker.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TmpDatepickerComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() label = '';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;

  private uniqueId = `tmp-datepicker-${++nextUniqueId}`;
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  writeValue(value: Date | null): void {
    // Implementation would set the datepicker value
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implementation would disable/enable the datepicker
  }

  get control(): FormControl {
    return this.controlDir.control as FormControl;
  }

  get datepickerId(): string {
    return this.uniqueId;
  }

  get errorId(): string {
    return `${this.uniqueId}-error`;
  }

}
