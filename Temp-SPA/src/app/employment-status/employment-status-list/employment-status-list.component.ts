import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faPlusCircle, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { EmploymentStatus, EmploymentStatusParams } from 'src/app/core/models/employmentStatus';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmploymentStatusService } from 'src/app/core/services/employment-status.service';
import { EmploymentStatusCreateModalComponent } from '../employment-status-create-modal/employment-status-create-modal.component';
import { EmploymentStatusEditModalComponent } from '../employment-status-edit-modal/employment-status-edit-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';

@Component({
    selector: 'app-employment-status-list',
    templateUrl: './employment-status-list.component.html',
    styleUrl: './employment-status-list.component.scss',
    standalone: false
})
export class EmploymentStatusListComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  editIcon = faEdit;
  archiveIcon = faTrashAlt;
  plusIcon = faPlusCircle;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'options', header: 'Options', align: 'center' }
  ];

  bsModalRef?: BsModalRef;
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  employmentStatuses!: EmploymentStatus[];
  pagination!: Pagination;
  employmentStatusParams!: EmploymentStatusParams;

  constructor(
    private route: ActivatedRoute,
    private employmentStatusService: EmploymentStatusService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService) {
      super();
      this.employmentStatusParams = employmentStatusService.getEmploymentStatusParams();
      this.filtersForm = this.fb.group({
        name: ['']
      });
    }

  ngAfterViewInit(): void {
    const nameControl = this.filtersForm.get('name');
    nameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.employmentStatusService.getEmploymentStatusParams();
      params.pageNumber = 1;
      params.name = searchFor;
      this.employmentStatusService.setEmploymentStatusParams(params);
      this.employmentStatusParams = params;
      this.loadEmploymentStatuses();
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.employmentStatuses = data['employmentStatuses'].result;
      this.pagination = data['employmentStatuses'].pagination;
    });
  }

  openCreateModal(): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Create Employment Status'
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EmploymentStatusCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmploymentStatuses();

        this.unsubscribe();
      }))
    }
  }

  openEditModal(id: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Edit Employment Status',
        employmentStatusId: id
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(EmploymentStatusEditModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadEmploymentStatuses();
        
        this.unsubscribe();
      }))
    }
  }

  loadEmploymentStatuses(): void {
    this.employmentStatusService.getPagedEmploymentStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: PaginatedResult<EmploymentStatus[]>) => {
          this.employmentStatuses = res.result;
          this.pagination = res.pagination;
        },
        error: () => {
          this.alertify.error('Unable to load employment statuses');
        }
      });
  }

  pageChanged(event: any): void {
    const params = this.employmentStatusService.getEmploymentStatusParams();
    if (params.pageNumber !== event) {
      this.pagination.currentPage = event;
      params.pageNumber = event;
      this.employmentStatusService.setEmploymentStatusParams(params);
      this.employmentStatusParams = params;
      this.loadEmploymentStatuses();
    }
  }

  changeStatus(id: number): void {
    this.employmentStatusService.changeStatus(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadEmploymentStatuses();
        this.alertify.success('Status changed');
      },
      error: () => {
        this.alertify.error('Unable to archive');
      }
    });
  }

  unsubscribe() {
    this.subscriptions.unsubscribe();
  }


}
