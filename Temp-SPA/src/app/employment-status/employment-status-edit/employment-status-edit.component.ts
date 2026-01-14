import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { EmploymentStatus } from 'src/app/core/models/employmentStatus';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmploymentStatusService } from 'src/app/core/services/employment-status.service';
import { EmploymentStatusValidators } from '../employment-status-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-employment-status-edit',
    templateUrl: './employment-status-edit.component.html',
    styleUrl: './employment-status-edit.component.scss',
    standalone: false
})
export class EmploymentStatusEditComponent extends DestroyableComponent implements OnInit {
  editEmploymentStatusForm!: FormGroup;
  employmentStatus!: EmploymentStatus;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)
  ])

  constructor(
    private employmentStatusService: EmploymentStatusService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private validators: EmploymentStatusValidators) {
      super();
    }

  ngOnInit(): void {
    this.editEmploymentStatusForm = this.fb.group({
      name: this.name
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.employmentStatus = data['employmentStatus'];
    });
    this.setupForm(this.employmentStatus);
  }


  setupForm(employmentStatus: EmploymentStatus): void {
    if (this.editEmploymentStatusForm)
      this.editEmploymentStatusForm.reset();

      this.name.addAsyncValidators(this.validators.validateNameNotTaken(employmentStatus.name));

      this.editEmploymentStatusForm.patchValue({
        name: employmentStatus.name
      });
  }

  update(): void {
    const employmentStatusForm = { ...this.editEmploymentStatusForm.value, id: this.employmentStatus.id};
    this.employmentStatusService.updateEmploymentStatus(employmentStatusForm).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update engagement');
      }
    });
  }

}
