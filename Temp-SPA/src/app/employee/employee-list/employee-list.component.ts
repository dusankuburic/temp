import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faLock, faLockOpen, faPlusCircle, faSitemap, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { Employee, EmployeeParams } from 'src/app/core/models/employee';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { UnassignRoleDto } from 'src/app/core/models/unassignRoleDto';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { ModalFactoryService } from 'src/app/core/services/modal-factory.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { EmployeeCreateModalComponent } from '../employee-create-modal/employee-create-modal.component';
import { EmployeeEditModalComponent } from '../employee-edit-modal/employee-edit-modal.component';
import { EmployeeAssignRoleModalComponent } from '../employee-assign-role-modal/employee-assign-role-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { UserRoles } from 'src/app/core/constants/app.constants';

@Component({
    selector: 'app-employee-list',
    templateUrl: './employee-list.component.html',
    styleUrl: './employee-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class EmployeeListComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  editIcon = faEdit
  assignRoleIcon = faSitemap
  removeRoleIcon = faUserTimes
  activateUserIcon = faLock
  deactivateUserIcon = faLockOpen
  plusIcon = faPlusCircle;

  columns: TableColumn[] = [
    { key: 'firstName', header: 'First Name', align: 'left' },
    { key: 'lastName', header: 'Last Name', align: 'left' },
    { key: 'role', header: 'Role', align: 'center' },
    { key: 'actions', header: 'Options', align: 'center' }
  ];

  bsModalRef?: BsModalRef;
  filtersForm!: FormGroup;
  
  // Reactive Streams
  paginatedResult!: PaginatedResult<Employee[]>;
  
  unassignRoleDto!: UnassignRoleDto;
  rolesSelect: SelectionOption[] = [
    {value: '', display: '', disabled: true},
    {value: '', display: 'All'},
    {value: UserRoles.USER, display: 'User'},
    {value: UserRoles.ADMIN, display: 'Admin'},
    {value: UserRoles.MODERATOR, display: 'Moderator'},
    {value: 'None', display: 'None'}];
  
  // Helper to keep track of current params for pagination
  private currentParams: EmployeeParams;

  isLoading = false;
  disableTableAnimations = false;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private modalFactory: ModalFactoryService,
    private cdr: ChangeDetectorRef) {
      super();
      this.currentParams = employeeService.getEmployeeParams();

      this.filtersForm = this.fb.group({
        role: [this.currentParams.role || ''],
        firstName: [this.currentParams.firstName || null],
        lastName: [this.currentParams.lastName || null]
      });
    }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.paginatedResult = data['employees'];
    });
  }

  ngAfterViewInit(): void {
    const roleControl = this.filtersForm.get('role');
    const firstNameControl = this.filtersForm.get('firstName');
    const lastNameControl = this.filtersForm.get('lastName');

    // Merge all form controls changes into one stream
    // This simplifies the logic: if any filter changes, we reload from page 1
    this.filtersForm.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe((vals) => {
         const params = this.employeeService.getEmployeeParams();
         params.pageNumber = 1;
         params.role = vals.role;
         params.firstName = vals.firstName;
         params.lastName = vals.lastName;
         
         this.currentParams = params;
         this.employeeService.setEmployeeParams(params);
         this.loadEmployees();
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.disableTableAnimations = true; // optional
    this.cdr.markForCheck();
    
    this.employeeService.getEmployees(this.currentParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
           this.paginatedResult = res;
           this.isLoading = false;
           this.disableTableAnimations = false;
           this.cdr.markForCheck();
        },
        error: () => {
           this.alertify.error('Unable to load employees');
           this.isLoading = false;
           this.cdr.markForCheck();
        }
      });
  }



  openCreateModal(): void {
    this.bsModalRef = this.modalFactory.open({
      component: EmployeeCreateModalComponent,
      cssClass: 'modal-dialog-centered',
      initialState: {
        title: 'Create Employee'
      },
      onSave: () => this.loadEmployees()
    }, this.destroy$);
  }

  openEditModal(id: number): void {
    this.bsModalRef = this.modalFactory.open({
      component: EmployeeEditModalComponent,
      cssClass: 'modal-dialog-centered modal-xl',
      initialState: {
        title: 'Edit Employee',
        employeeId: id
      },
      onSave: () => this.loadEmployees()
    }, this.destroy$);
  }

  openAssignRoleModal(id: number, firstName: string, lastName: string): void {
    this.bsModalRef = this.modalFactory.open({
      component: EmployeeAssignRoleModalComponent,
      cssClass: 'modal-dialog-centered',
      initialState: {
        title: 'Assign Role',
        employeeId: id,
        firstName: firstName,
        lastName: lastName
      },
      onSave: () => this.loadEmployees()
    }, this.destroy$);
  }

  pageChanged(event: any): void {
    // event comes from pagination component, usually number
    if (this.currentParams.pageNumber !== event) {
      this.currentParams.pageNumber = event;
      this.loadEmployees(); 
    }
  }

  removeRole(id: number): void {
    this.unassignRoleDto = {id: id};
    this.employeeService.unassignRole(this.unassignRoleDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEmployees();
          this.alertify.success('Remove role');
        },
        error: () => {
          this.alertify.error('Unable to remove role');
        }
      });
  }

  changeStatus(id: number): void {
    this.unassignRoleDto = {id: id};
    this.employeeService.changeStatus(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadEmployees();
          this.alertify.success('Status changed');
        },
        error: () => {
          this.alertify.error('Unable to change status');
        }
      });
  }
}
