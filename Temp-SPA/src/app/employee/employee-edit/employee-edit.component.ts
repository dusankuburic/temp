import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, lastValueFrom, takeUntil } from 'rxjs';
import { Employee } from 'src/app/core/models/employee';
import { Group, ModeratorGroups } from 'src/app/core/models/group';
import { ModeratorMin } from 'src/app/core/models/moderator';
import { FullTeam } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { GroupService } from 'src/app/core/services/group.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { TeamService } from 'src/app/core/services/team.service';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-employee-edit',
    templateUrl: './employee-edit.component.html',
    styleUrl: './employee-edit.component.scss',
    standalone: false
})
export class EmployeeEditComponent extends DestroyableComponent implements OnInit {
  minusIcon = faMinus;
  plusIcon = faPlus;

  editEmployeeForm!: FormGroup;
  employee!: Employee;
  fullTeam!: FullTeam;
  organizationsSelect!: SelectionOption<number>[];
  innerGroupsSelect!: SelectionOption<number>[];
  innerTeamsSelect!: SelectionOption<number>[];
  currentModeratorGroups!: Group[];
  freeModeratorGroups!: Group[];

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
    private teamService: TeamService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private alertify: AlertifyService) {
    super();
  }

  ngOnInit(): void {
    this.editEmployeeForm = this.fb.group({
      firstName: this.firstName,
      lastName: this.lastName,
      organizationId: [null, Validators.required],
      groupId: [null, Validators.required],
      teamId: [null, Validators.required]
    });
    this.editEmployeeForm.get('organizationId')?.disable();

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.employee = data['employee'];
      this.setupForm(this.employee);

      if (this.employee?.role === 'Moderator') {
        this.loadModeratorGroups(this.employee.teamId, this.employee.id);
      } else {
        this.loadFullTeam(this.employee.teamId);
      }
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

  setupForm(employee: Employee): void {
    if (this.editEmployeeForm)
      this.editEmployeeForm.reset();

      this.editEmployeeForm.patchValue({
        firstName: employee.firstName,
        lastName: employee.lastName
      });
  }

  loadFullTeam(id: number): void {
    this.teamService.getFullTeam(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.fullTeam = res;
      this.loadOrgData(this.fullTeam);
    });
  }

  async loadModeratorGroups(id: number, EmployeeId: number) {
    try {
      const fullTeam = await lastValueFrom(this.teamService.getFullTeam(id).pipe(takeUntil(this.destroy$)));
      this.fullTeam = fullTeam;
      this.loadOrgData(this.fullTeam);

      const moderator = await firstValueFrom(this.employeeService.getModerator(EmployeeId).pipe(takeUntil(this.destroy$)));
      const moderatorMin: ModeratorMin = {id: moderator.id};

      try {
        const currModerGroup = await firstValueFrom(this.groupService.getModeratorGroups(moderator.id).pipe(takeUntil(this.destroy$)));
        this.currentModeratorGroups = currModerGroup;
      } catch (error: any) {
        this.currentModeratorGroups = [];
        this.alertify.error(error.error);
      }

      try {
        const res = await firstValueFrom(this.groupService.getModeratorFreeGroups(this.fullTeam.organizationId, moderatorMin).pipe(takeUntil(this.destroy$)));
        this.freeModeratorGroups = res;
      } catch (error: any) {
        this.alertify.error(error.error);
      }
    } catch (error) {
      this.alertify.error('Failed to load moderator groups');
    }
  }

  loadOrgData(fullTeam: FullTeam) {
    this.editEmployeeForm.get('organizationId')?.setValue(fullTeam.organizationId);
    this.organizationService.getInnerGroupsForSelect(fullTeam.organizationId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
      }
    });

    this.editEmployeeForm.get('groupId')?.setValue(fullTeam.groupId);
    this.groupService.getInnerTeamsForSelect(fullTeam.groupId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerTeamsSelect = [];
        this.innerTeamsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
      }
    });
    this.editEmployeeForm.get('teamId')?.setValue(fullTeam.teamId);
  }

  loadInnerGroups(id: number | null): void {
    if (id == null)
      return;
    this.organizationService.getInnerGroupsForSelect(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
        this.editEmployeeForm.get('teamId')?.setValue(null);
      }
    });
  }

  loadInnerTeams(id: number | null): void {
    if (id == null)
      return;
    this.groupService.getInnerTeamsForSelect(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerTeamsSelect = [];
        this.innerTeamsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
        this.editEmployeeForm.get('teamId')?.setValue(null);
      }
    });
  }

  updateGroup(moderatorId: number, newGroupId: number): void {
    const moderatorGroups = {} as ModeratorGroups;
    moderatorGroups.groups = [];

    this.currentModeratorGroups.forEach((elem) => {
      moderatorGroups.groups.push(elem.id);
    });

    if (!moderatorGroups.groups.includes(newGroupId)) {
      moderatorGroups.groups.push(newGroupId);
    } else {
      moderatorGroups.groups = moderatorGroups.groups
      .filter(elem => elem !== newGroupId);
    }

    this.groupService.updateModeratorGroups(moderatorId, moderatorGroups.groups).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadModeratorGroups(this.employee.teamId, this.employee.id);
        this.alertify.success('Success');
      },
      error: () => {
        this.alertify.error('Unable to manage groups');
      }
    });
  }

  update(): void {
    const employeeForm = { ...this.editEmployeeForm.value, id: this.employee.id };

    if (employeeForm.teamId == null) {
      employeeForm.teamId = this.employee.teamId;
    }

    this.employeeService.updateEmployee(employeeForm).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update employee');
      }
    });
  }
}
