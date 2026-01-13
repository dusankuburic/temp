import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { Employee } from 'src/app/core/models/employee';
import { EngagementParams } from 'src/app/core/models/engagement';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EngagementService } from 'src/app/core/services/engagement.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { EngagementCreateModalComponent } from '../engagement-create-modal/engagement-create-modal.component';

@Component({
    selector: 'app-engagement-without-employee-list',
    templateUrl: './engagement-without-employee-list.component.html',
    styleUrl: './engagement-without-employee-list.component.scss',
    standalone: false
})
export class EngagementWithoutEmployeeListComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  addEngagementIcon = faCodeBranch

  bsModalRef?: BsModalRef;
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  employees!: Employee[];
  rolesSelect: SelectionOption[] = [
    {value: '', display: '', disabled: true},
    {value: '', display: 'All'},
    {value: 'User', display: 'User'},
    {value: 'Admin', display: 'Admin'},
    {value: 'Moderator', display: 'Moderator'},
    {value: 'None', display: 'None'}];
  engagementParams!: EngagementParams;
  pagination!: Pagination;
  isLoading = false;
  
  columns = [
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'role', header: 'Role' },
    { key: 'actions', header: 'Actions', align: 'center' as const }
  ];
  
  constructor(
    private route: ActivatedRoute,
    private engagementService: EngagementService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService) {
      super();
      this.engagementParams = engagementService.getEngagementParams();

      this.filtersForm = this.fb.group({
        role: [''],
        firstName: [''],
        lastName: ['']
      });
    }

  ngAfterViewInit(): void {
    const roleControl = this.filtersForm.get('role');
    roleControl?.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.engagementService.getEngagementParams();
      params.pageNumber = 1;
      this.engagementParams.role = searchFor;
      this.engagementService.setEngagementParams(params);
      this.engagementParams = params;
      this.loadEmployeesWithoutEngagement();
    });

    const firstNameControl = this.filtersForm.get('firstName');
    firstNameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.engagementService.getEngagementParams();
      params.pageNumber = 1;
      params.firstName = searchFor;
      this.engagementService.setEngagementParams(params);
      this.engagementParams = params;
      this.loadEmployeesWithoutEngagement();
    });

    const lastNameControl = this.filtersForm.get('lastName');
    lastNameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.engagementService.getEngagementParams();
      params.pageNumber = 1;
      params.lastName = searchFor;
      this.engagementService.setEngagementParams(params);
      this.engagementParams = params;
      this.loadEmployeesWithoutEngagement();
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.employees = data['employeesWithout'].result;
      this.pagination = data['employeesWithout'].pagination;
    });
  }

  openCreateModal(employeeId: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered modal-lg',
      initialState: {
        title: 'Create Engagement',
        employeeId: employeeId
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EngagementCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmployeesWithoutEngagement();

        this.unsubscribe();
      }))
    }
  }

  unsubscribe() {
    this.subscriptions.unsubscribe();
  }

  loadEmployeesWithoutEngagement(): void {
    this.isLoading = true;
    this.engagementService.getEmployeesWithoutEngagement()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: PaginatedResult<Employee[]>) => {
        this.employees = res.result;
        this.pagination = res.pagination;
        this.isLoading = false;
      },
      error: () => {
        this.alertify.error('Unable to list employees');
        this.isLoading = false;
      }
    });
  }

  pageChanged(event: any): void {
    const params = this.engagementService.getEngagementParams();
    if (params.pageNumber !== event) {
      this.pagination.currentPage = event;
      params.pageNumber = event;
      this.engagementService.setEngagementParams(params);
      this.engagementParams = params;
      this.loadEmployeesWithoutEngagement();
    }
  }

}
