import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faPlusCircle, faProjectDiagram, faTrashAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subscription, combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { Organization, OrganizationParams } from 'src/app/core/models/organization';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { OrganizationCreateModalComponent } from '../organization-create-modal/organization-create-modal.component';
import { OrganizationEditModalComponent } from '../organization-edit-modal/organization-edit-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
  selector: 'app-organization-list',
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class OrganizationListComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  editOrganizationIcon = faEdit;
  archiveOrganizationIcon = faTrashAlt;
  innerGroupsIcon = faUsers;
  createGroupIcon = faProjectDiagram;
  plusIcon = faPlusCircle;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'options', header: 'Options', align: 'center' },
    { key: 'groupOptions', header: 'Group Options', align: 'center' }
  ];

  bsModalRef?: BsModalRef;
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  
  paginatedResult!: PaginatedResult<Organization[]>;
  
  currentParams: OrganizationParams;
  isLoading = false;

  groupsSelect: SelectionOption[] = [
    {value: '', display: 'Select...', disabled: false },
    {value: 'all', display: 'All'},
    {value: 'yes', display: 'With groups'},
    {value: 'no', display: 'Without groups'}
  ];

  constructor(
    private route: ActivatedRoute,
    private organizationsService: OrganizationService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService,
    private cdr: ChangeDetectorRef) {
      super();
      this.currentParams = organizationsService.getOrganizationParams();

      this.filtersForm = this.fb.group({
        withGroups: [this.currentParams.withGroups || ''],
        name: [this.currentParams.name || '']
      });
    }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.paginatedResult = data['organizations'];
    });
  }

  ngAfterViewInit(): void {
    const withGroupsControl = this.filtersForm.get('withGroups');
    withGroupsControl?.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.organizationsService.getOrganizationParams();
      params.pageNumber = 1;
      this.currentParams.withGroups = searchFor;
      this.organizationsService.setOrganizationParams(params);
      this.currentParams = params;
      this.loadOrganizations();
    });

    const nameControl = this.filtersForm.get('name');
    nameControl?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.organizationsService.getOrganizationParams();
      params.pageNumber = 1;
      this.currentParams.name = searchFor;
      this.organizationsService.setOrganizationParams(params);
      this.currentParams = params;
      this.loadOrganizations();
    });
  }

  loadOrganizations(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.organizationsService.getPagedOrganizations(this.currentParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: PaginatedResult<Organization[]>) => {
          this.paginatedResult = res;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.alertify.error('Unable to load organizations');
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  openCreateModal(): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Create Organization'
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(OrganizationCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved) {
          this.loadOrganizations();
        }
        this.unsubscribe();
      }));
    }
  }

  openEditModal(id: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered modal-xl',
      initialState: {
        title: 'Edit Organization',
        organizationId: id
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(OrganizationEditModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved) {
          this.loadOrganizations();
        }
        this.unsubscribe();
      }));
    }
  }

  unsubscribe() {
    this.subscriptions.unsubscribe();
  }

  pageChanged(event: any): void {
    if (this.currentParams.pageNumber !== event) {
      this.currentParams.pageNumber = event;
      this.loadOrganizations();
    }
  }

  changeStatus(id: number): void {
    this.organizationsService.changeStatus(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadOrganizations();
        this.alertify.success('Status changed');
      },
      error: () => {
        this.alertify.error('Unable to change status');
      }
    });
  }
}
