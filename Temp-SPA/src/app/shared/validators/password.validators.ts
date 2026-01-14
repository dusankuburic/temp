import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class PasswordValidator {
    static match(masterControlName: string, litmusControlName: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const masterControl = group.get(masterControlName);
            const litmusControl = group.get(litmusControlName);

            if (!masterControl || !litmusControl) {
                console.error('Form control can not be found in the form group.');
                return { controlNotFound: false };
            }

            const error = masterControl.value === litmusControl.value
                ? null
                : { noMatch: true };

            litmusControl.setErrors(error);
            return error;
        }
    }
}
