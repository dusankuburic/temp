import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Team } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { TeamService } from 'src/app/core/services/team.service';
import { TeamValidators } from '../team-validators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-team-create-modal',
    templateUrl: './team-create-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class TeamCreateModalComponent extends DestroyableComponent implements OnInit {
  createTeamForm!: FormGroup;
  team!: Team;
  groupId!: number;
  title?: string;
  
  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private teamService: TeamService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: TeamValidators,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.createTeamForm = this.fb.group({
      name: this.name
    });
    this.name.setAsyncValidators(this.validators.validateNameNotTaken(this.groupId));
  }

  create(): void {
    this.team = {...this.createTeamForm.value, groupId: this.groupId};
    this.teamService.createTeam(this.team).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.alertify.success('Successfully created')
        this.createTeamForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create team');
      }
    });
  }
}
