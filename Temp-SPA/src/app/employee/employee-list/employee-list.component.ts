import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faLock, faLockOpen, faPlusCircle, faSitemap, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Employee, EmployeeParams } from 'src/app/core/models/employee';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { UnassignRoleDto } from 'src/app/core/models/unassignRoleDto';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { EmployeeCreateModalComponent } from '../employee-create-modal/employee-create-modal.component';
import { EmployeeEditModalComponent } from '../employee-edit-modal/employee-edit-modal.component';
import { EmployeeAssignRoleModalComponent } from '../employee-assign-role-modal/employee-assign-role-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

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
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  employees!: Employee[];
  unassignRoleDto!: UnassignRoleDto;
  rolesSelect: SelectionOption[] = [
    {value: '', display: '', disabled: true},
    {value: '', display: 'All'},
    {value: 'User', display: 'User'},
    {value: 'Admin', display: 'Admin'},
    {value: 'Moderator', display: 'Moderator'},
    {value: 'None', display: 'None'}];
  employeeParams!: EmployeeParams;

  pagination!: Pagination;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService) {
      super();
      this.employeeParams = employeeService.getEmployeeParams();

      this.filtersForm = this.fb.group({
        role: [''],
        firstName: [null],
        lastName: [null]
      });
    }
    
  ngAfterViewInit(): void {
    const roleControl = this.filtersForm.get('role');
    roleControl?.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
        const params = this.employeeService.getEmployeeParams();
        params.pageNumber = 1;
        this.employeeParams.role = searchFor;
        this.employeeService.setEmployeeParams(params);
        this.employeeParams = params;
        this.loadEmployees();
    });

    const firstNameControl = this.filtersForm.get('firstName');
    firstNameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
        const params = this.employeeService.getEmployeeParams();
        params.pageNumber = 1;
        params.firstName = searchFor;
        this.employeeService.setEmployeeParams(params);
        this.employeeParams = params;
        this.loadEmployees();
    });

    const lastNameControl = this.filtersForm.get('lastName');
    lastNameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.employeeService.getEmployeeParams();
      params.pageNumber = 1;
      params.lastName = searchFor;
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
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Create Employee'
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EmployeeCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmployees();
        
        this.unsubscribe();
      }))
    }
  }

  openEditModal(id: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered modal-xl',
      initialState: {
        title: 'Edit Employee',
        employeeId: id
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EmployeeEditModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmployees();
        
        this.unsubscribe();
      }))
    }
  }

  openAssignRoleModal(id: number, firstName: string, lastName: string): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Assign Role',
        employeeId: id,
        firstName: firstName,
        lastName: lastName
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EmployeeAssignRoleModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmployees();
        
        this.unsubscribe();
      }))
    }
  }

  unsubscribe() {
    this.subscriptions.unsubscribe();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees()
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: PaginatedResult<Employee[]>) => {
          this.employees = res.result;
          this.pagination = res.pagination;
          this.isLoading = false;
        },
        error: () => {
          this.alertify.error('Unable to load employees');
          this.isLoading = false;
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
