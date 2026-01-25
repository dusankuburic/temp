import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faLock, faLockOpen, faPlusCircle, faSitemap, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { combineLatest, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
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
  employees!: Employee[];
  disableTableAnimations = false;
  unassignRoleDto!: UnassignRoleDto;
  rolesSelect: SelectionOption[] = [
    {value: '', display: '', disabled: true},
    {value: '', display: 'All'},
    {value: UserRoles.USER, display: 'User'},
    {value: UserRoles.ADMIN, display: 'Admin'},
    {value: UserRoles.MODERATOR, display: 'Moderator'},
    {value: 'None', display: 'None'}];
  employeeParams!: EmployeeParams;

  pagination!: Pagination;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private modalFactory: ModalFactoryService) {
      super();
      this.employeeParams = employeeService.getEmployeeParams();

      this.filtersForm = this.fb.group({
        role: [''],
        firstName: [null],
        lastName: [null]
      });
    }
    
  ngAfterViewInit(): void {
    combineLatest([
      this.filtersForm.get('role')!.valueChanges.pipe(
        startWith(this.filtersForm.get('role')!.value),
        debounceTime(100),
        distinctUntilChanged()
      ),
      this.filtersForm.get('firstName')!.valueChanges.pipe(
        startWith(this.filtersForm.get('firstName')!.value),
        debounceTime(600),
        distinctUntilChanged()
      ),
      this.filtersForm.get('lastName')!.valueChanges.pipe(
        startWith(this.filtersForm.get('lastName')!.value),
        debounceTime(600),
        distinctUntilChanged()
      )
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([role, firstName, lastName]) => {
      const params = this.employeeService.getEmployeeParams();
      params.pageNumber = 1;
      params.role = role;
      params.firstName = firstName;
      params.lastName = lastName;
      this.employeeService.setEmployeeParams(params);
      this.employeeParams = params;
      this.loadEmployees();
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.employees = data['employees'].result;
      this.pagination = data['employees'].pagination;
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

  loadEmployees(): void {
    this.isLoading = true;
    this.disableTableAnimations = true;
    this.employeeService.getEmployees()
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: PaginatedResult<Employee[]>) => {
          this.employees = res.result;
          this.pagination = res.pagination;
          this.isLoading = false;
          setTimeout(() => this.disableTableAnimations = false, 0);
        },
        error: () => {
          this.alertify.error('Unable to load employees');
          this.isLoading = false;
          setTimeout(() => this.disableTableAnimations = false, 0);
        }
      });
  }

  pageChanged(event: any): void {
    const params = this.employeeService.getEmployeeParams();
    if (params.pageNumber !== event) {
      this.pagination.currentPage = event;
      params.pageNumber = event;
      this.employeeService.setEmployeeParams(params);
      this.employeeParams = params;
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
