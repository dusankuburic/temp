import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { Employee } from 'src/app/core/models/employee';
import { Engagement, ExistingEngagement } from 'src/app/core/models/engagement';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { EmploymentStatusService } from 'src/app/core/services/employment-status.service';
import { EngagementService } from 'src/app/core/services/engagement.service';
import { WorkplaceService } from 'src/app/core/services/workplace.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';

@Component({
    selector: 'app-engagement-create',
    templateUrl: './engagement-create.component.html',
    styleUrl: './engagement-create.component.scss',
    standalone: false
})
export class EngagementCreateComponent extends DestroyableComponent implements OnInit {
  employeeId!: number;
  createEngagementForm!: FormGroup;
  engagement!: Engagement;

  existingEngagements!: ExistingEngagement[];
  employee!: Employee;
  workplacesList!: SelectionOption<number>[];
  employmentStatusesList!: SelectionOption<number>[];

  salary = new FormControl('', [
    Validators.required,
    Validators.min(300),
    Validators.max(5000)
  ]);

  dateFrom = new FormControl(null, [Validators.required]);
  dateTo = new FormControl(null, [Validators.required]);

  constructor(
    private route: ActivatedRoute,
    private engagementService: EngagementService,
    private employmentStatusService: EmploymentStatusService,
    private employeeService: EmployeeService,
    private workplaceService: WorkplaceService,
    private fb: FormBuilder,
    private alertify: AlertifyService) {
    super();
  }

  ngOnInit(): void {
    this.createEngagementForm = this.fb.group({
      workplaceId: [null, Validators.required],
      salary: this.salary,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      employmentStatusId: [null, Validators.required]
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.existingEngagements = data['employeeData'];
    });

    this.loadEmployee();
    this.loadWorkplaces();
    this.loadEmploymentStatuses();
  }

  loadEmployee(): void {
    const employeeId = parseInt(this.route.snapshot.paramMap.get('id') ?? '0')
    this.employeeService.getEmployee(employeeId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.employee = res;
        },
        error: () => {
          this.alertify.error('Unable get employee')
        }
      });
  }

  loadWorkplaces(): void {
    this.workplaceService.getWorkplacesForSelect().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.workplacesList = [
          {value: null, display: '', disabled: true},
          ...res
        ];
      },
      error: () => {
        this.alertify.error('Unable to list workplaces');
      }
    });
  }

  loadEmploymentStatuses(): void {
    this.employmentStatusService.getEmploymentStatusesForSelect().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.employmentStatusesList = [
          {value: null, display: '', disabled: true},
          ...res
        ];
      },
      error: () => {
        this.alertify.error('Unable to list Employment statuses');
      }
    })
  }

  loadEngagements(): void {
    this.engagementService.getEngagementForEmployee(this.employee.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.existingEngagements = res;
      },
      error: () => {
        this.alertify.error('Unable to list engagements');
      }
    });
  }

  create(): void {
    this.engagement = { ...this.createEngagementForm.value, employeeId: this.employee.id };
    this.engagementService.createEngagement(this.engagement).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadEngagements();
        this.alertify.success('Successfully created');
        this.createEngagementForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create engagement');
      }
    });
  } 
}
