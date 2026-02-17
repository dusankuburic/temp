import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { faEdit, faPlusCircle, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subscription, combineLatest, debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { InnerGroup } from 'src/app/core/models/group';
import { Pagination } from 'src/app/core/models/pagination';
import { InnerTeam, PagedInnerTeams, TeamParams } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { TeamService } from 'src/app/core/services/team.service';
import { TeamCreateModalComponent } from '../team-create-modal/team-create-modal.component';
import { TeamEditModalComponent } from '../team-edit-modal/team-edit-modal.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';

@Component({
  selector: 'app-team-list',
  templateUrl: './inner-team-list.component.html',
  styleUrl: './inner-team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TeamListComponent extends DestroyableComponent implements OnInit {
  editTeamIcon = faEdit;
  archiveTeamIcon = faTrashAlt;
  plusIcon = faPlusCircle;

  columns: TableColumn[] = [
    { key: 'name', header: 'Name', align: 'left' },
    { key: 'options', header: 'Options', align: 'center' }
  ];

  bsModalRef?: BsModalRef;
  subscriptions!: Subscription;
  filtersForm!: FormGroup;
  
  pagedInnerTeams$: Observable<PagedInnerTeams>;
  refresh$ = new BehaviorSubject<void>(undefined);
  
  currentParams: TeamParams;
  isLoading = false;
  groupId!: number;

  constructor(
    private route: ActivatedRoute,
    private teamService: TeamService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private bsModalService: BsModalService,
    private cdr: ChangeDetectorRef) {
      super();
      this.currentParams = teamService.getTeamParams();

      this.filtersForm = this.fb.group({
        name: [this.currentParams.name || '']
      });

      const filters$ = combineLatest([
        this.filtersForm.get('name')!.valueChanges.pipe(startWith(this.filtersForm.get('name')!.value), debounceTime(600), distinctUntilChanged())
      ]);

      // We get groupId from route data initially, but it's constant for this view instance.
      // The resolver 'innerteams' provides the initial data.
      const initialData$ = this.route.data.pipe(
        map(data => data['innerteams'] as PagedInnerTeams),
        tap(data => {
          this.groupId = data.id;
        })
      );

      this.pagedInnerTeams$ = initialData$.pipe(
        switchMap(initial => {
          return combineLatest([
            filters$,
            this.refresh$
          ]).pipe(
            tap(() => {
              this.isLoading = true;
              this.cdr.markForCheck();
            }),
            debounceTime(100),
            switchMap(([[name], _]) => {
              const params = new TeamParams();
              params.pageNumber = this.currentParams.pageNumber;
              
              if (name !== this.currentParams.name) {
                params.pageNumber = 1;
              }

              params.pageSize = this.currentParams.pageSize;
              params.name = name;

              this.currentParams = params;
              this.teamService.setTeamParams(params);

              return this.teamService.getInnerTeams(this.groupId, params).pipe(
                tap(() => {
                  this.isLoading = false;
                  this.cdr.markForCheck();
                })
              );
            })
          );
        })
      );
    }

  ngOnInit(): void {
  }

  openCreateModal(groupId: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered',
      initialState: {
        title: 'Create Team',
        groupId: groupId
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(TeamCreateModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved) {
          this.refresh$.next();
        }
        this.unsubscribe();
      }));
    }
  }

  openEditModal(teamId: number, groupId: number): void {
    const initialState: ModalOptions = {
      class: 'modal-dialog-centered modal-xl',
      initialState: {
        title: 'Edit Team',
        teamId: teamId,
        groupId: groupId
      }
    };
    this.subscriptions = new Subscription();
    this.bsModalRef = this.bsModalService.show(TeamEditModalComponent, initialState);
    if (this.bsModalRef?.onHidden) {
      this.subscriptions.add(this.bsModalRef.onHidden.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.bsModalRef?.content?.isSaved) {
          this.refresh$.next();
        }
        this.unsubscribe();
      }));
    }
  }

  pageChanged(event: any): void {
    if (this.currentParams.pageNumber !== event) {
      this.currentParams.pageNumber = event;
      this.refresh$.next();
    }
  }

  changeStatus(id: number): void {
    this.teamService.changeStatus(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.refresh$.next();
        this.alertify.success('Status changed');
      },
      error: () => {
        this.alertify.error('Unable to change status');
      }
    });
  }

  unsubscribe() {
    this.subscriptions.unsubscribe();
  }
}
