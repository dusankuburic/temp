import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaginatedResult, Pagination } from 'src/app/core/models/pagination';
import { Workplace, WorkplaceParams } from 'src/app/core/models/workplace';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { WorkplaceService } from 'src/app/core/services/workplace.service';
import { faPenToSquare, faPlusCircle, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { WorkplaceCreateModalComponent } from '../workplace-create-modal/workplace-create-modal.component';
import { WorkplaceEditModalComponent } from '../workplace-edit-modal/workplace-edit-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';

@Component({
    selector: 'app-workplace-list',
    templateUrl: './workplace-list.component.html',
    styleUrl: './workplace-list.component.scss',
    standalone: false
})
export class WorkplaceListComponent extends DestroyableComponent implements OnInit, AfterViewInit {
  archiveIcon = faTrashAlt;
  editIcon = faPenToSquare
  plusIcon = faPlusCircle;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'options', header: 'Options', align: 'center' }
  ];

  bsModalRef?: BsModalRef;
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  workplaces!: Workplace[];
  pagination!: Pagination;
  workplaceParams!: WorkplaceParams;

  constructor(
    private route: ActivatedRoute,
    private workplaceService: WorkplaceService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService) {
      super();
      this.workplaceParams = workplaceService.getWorkplaceParams();
      this.filtersForm = this.fb.group({
        name: [''],
      })
    }
    
  ngAfterViewInit(): void {
    this.filtersForm.get('name')?.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((searchFor) => {
      const params = this.workplaceService.getWorkplaceParams();
      params.pageNumber = 1;
      params.name = searchFor;
      this.workplaceService.setWorkplaceParams(params);
      this.workplaceParams = params;
      this.loadWorkplaces();
    });
  }
 
  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.workplaces = data['workplaces'].result;
      this.pagination = data['workplaces'].pagination;
    });
  }

  openCreateModal(): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Create Workplace'
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(WorkplaceCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadWorkplaces();

        this.unsubscribe();
      }))
    }
  }

  openEditModal(id: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Edit Workplace',
        workplaceId: id
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(WorkplaceEditModalComponent, initialState);

    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved)
          this.loadWorkplaces();

        this.unsubscribe();
      }))
    }
  }
  unsubscribe() {
    this.subscriptions.unsubscribe();
  }


  loadWorkplaces(): void {
    this.workplaceService.getPagedWorkplaces()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: PaginatedResult<Workplace[]>) => {
          this.workplaces = res.result;
          this.pagination = res.pagination;
        },
        error: () => {
          this.alertify.error('Unable to load workplaces');
        }
      });
  }

  pageChanged(event: any): void {
    const params = this.workplaceService.getWorkplaceParams();
    if (params.pageNumber !== event) {
      this.pagination.currentPage = event;
      params.pageNumber = event;
      this.workplaceService.setWorkplaceParams(params);
      this.workplaceParams = params;
      this.loadWorkplaces();
    }
  }

  changeStatus(id: number): void {
    this.workplaceService.changeStatus({id}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadWorkplaces();
        this.alertify.success('Status is changed');
      },
      error: () => {
        this.alertify.error('Unable to archive');
      }
    });
  }



}
