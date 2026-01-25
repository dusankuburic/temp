import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Employee } from 'src/app/core/models/employee';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { GroupService } from 'src/app/core/services/group.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-employee-create',
    templateUrl: './employee-create.component.html',
    styleUrl: './employee-create.component.scss',
    standalone: false
})
export class EmployeeCreateComponent extends DestroyableComponent implements OnInit {
  createEmployeeForm!: FormGroup;
  employee!: Employee;
  organizationsSelect!: SelectionOption<number>[];
  innerGroupsSelect!: SelectionOption<number>[];
  innerTeamsSelect!: SelectionOption<number>[];

  firstName = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)
  ]);

  lastName = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)
  ]);

  constructor(
    private employeeService: EmployeeService,
    private organizationService: OrganizationService,
    private groupService: GroupService,
    private alertify: AlertifyService,
    private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.createEmployeeForm = this.fb.group({
      firstName: this.firstName,
      lastName: this.lastName,
      organizationId: [null, Validators.required],
      groupId: [null, Validators.required],
      teamId: [null, Validators.required]
    });
    
    this.organizationService.getOrganizationsForSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        this.organizationsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
    });
  }

  loadInnerGroups(id: number | null): void {
    if (id == null)
      return;
    this.organizationService.getInnerGroupsForSelect(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res !== null) {
          this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
            ...res
          ];
          this.createEmployeeForm.get('groupId')?.setValue(null);
          this.innerTeamsSelect = [{value: null, display: '', hidden: true}];
        }
      });
  }

  loadInnerTeams(id: number | null): void {
    if (id == null)
      return;
    this.groupService.getInnerTeamsForSelect(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res !== null) {
          this.innerTeamsSelect = [];
          this.innerTeamsSelect = [
            {value: null, display: '', hidden: true},
            ...res
          ];
          this.createEmployeeForm.get('teamId')?.setValue(null);
        }
      });
  }

  create(): void {
    this.employee = { ...this.createEmployeeForm.value };
    this.employeeService.createEmployee(this.employee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertify.success('Successfully created');
          this.createEmployeeForm.reset();
        },
        error: () => {
          this.alertify.error('Unable to create employee');
        }
      });
  }

}
