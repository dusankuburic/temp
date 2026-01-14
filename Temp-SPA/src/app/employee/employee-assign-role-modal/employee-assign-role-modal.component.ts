import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { debounceTime, finalize, map, switchMap, take, takeUntil } from 'rxjs';
import { AssignRoleDto } from 'src/app/core/models/assignRoleDto';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { PasswordValidator } from 'src/app/shared/validators/password.validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-employee-assign-role-modal',
    templateUrl: './employee-assign-role-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class EmployeeAssignRoleModalComponent extends DestroyableComponent implements OnInit {

  title?: string;
  firstName!: string;
  lastName!: string;
  employeeId!: number;
  createAssignRoleForm!: FormGroup;
  assignDto!: AssignRoleDto;
  
  displayName = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(30)]);

  email = new FormControl('', 
  [Validators.required, Validators.email], 
  [this.validateEmailNotTaken()]);

  passwordPattern: RegExp = /^(?=[^A-Z]*[A-Z])(?=[^a-z]*[a-z])(?=\D*\d).{8,}$/;
  password = new FormControl('', [
    Validators.required,
    Validators.pattern(this.passwordPattern)]);

  confirmPassword = new FormControl('', [Validators.required]);

  constructor(
    private employeeService: EmployeeService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.createAssignRoleForm = this.fb.group({
      role: ['', Validators.required],
      email: this.email,
      displayName: this.displayName,
      password: this.password,
      confirmPassword: this.confirmPassword
    });

    this.setupForm();
  }

  setupForm(): void {
    this.createAssignRoleForm.get('role')?.setValue('User');
    this.createAssignRoleForm.addValidators([PasswordValidator.match('password', 'confirmPassword')]);
  }

  register(): void {
    if (this.createAssignRoleForm.valid) {
      this.assignDto = { ...this.createAssignRoleForm.value, employeeId: this.employeeId, firstName: this.firstName, lastName: this.lastName };
      this.employeeService.assignRole(this.assignDto).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.bsModalRef.content.isSaved = true;
        this.createAssignRoleForm.disable();
        this.alertify.success('Successful user registration');
        this.bsModalRef.hide();
      }, (error: any) => {
        this.alertify.error(error.error);
      });
    }
  }

  validateEmailNotTaken(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return control.valueChanges.pipe(
        debounceTime(600),
        take(1),
        switchMap(() => {
          return this.employeeService.checkEmailExists(control.value).pipe(
            map(result => result ? {usernameExists: true} : null),
            finalize(() => control.markAsTouched())
          )
        })
      )
    }
  }
}
