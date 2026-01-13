import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { EmploymentStatus } from 'src/app/core/models/employmentStatus';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmploymentStatusService } from 'src/app/core/services/employment-status.service';
import { EmploymentStatusValidators } from '../employment-status-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-employment-status-create',
    templateUrl: './employment-status-create.component.html',
    styleUrl: './employment-status-create.component.scss',
    standalone: false
})
export class EmploymentStatusCreateComponent extends DestroyableComponent implements OnInit {
  createEmploymentStatusForm!: FormGroup;
  employmentStatus!: EmploymentStatus;

  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)],
    [this.validators.validateNameNotTaken()]);

  constructor(
    private employmentStatusService: EmploymentStatusService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: EmploymentStatusValidators) {
      super();
    }

  ngOnInit(): void {
    this.createEmploymentStatusForm = this.fb.group({
      name: this.name
    });
  }

  create(): void {
    this.employmentStatus = { ...this.createEmploymentStatusForm.value };
    this.employmentStatusService.createEmploymentStatus(this.employmentStatus).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully created');
        this.createEmploymentStatusForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create employment status');
      }
    });
  }

}
