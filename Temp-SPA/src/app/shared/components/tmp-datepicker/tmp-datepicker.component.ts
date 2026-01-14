import { Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';


let nextUniqueId = 0;

@Component({
    selector: 'tmp-datepicker',
    templateUrl: './tmp-datepicker.component.html',
    styleUrl: './tmp-datepicker.component.scss',
    standalone: false
})
export class TmpDatepickerComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() label = '';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;

  private uniqueId = `tmp-datepicker-${++nextUniqueId}`;

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}

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
