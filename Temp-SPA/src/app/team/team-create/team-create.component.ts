import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Group } from 'src/app/core/models/group';
import { Team } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { TeamService } from 'src/app/core/services/team.service';
import { TeamValidators } from '../team-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-team-create',
    templateUrl: './team-create.component.html',
    styleUrl: './team-create.component.scss',
    standalone: false
})
export class TeamCreateComponent extends DestroyableComponent implements OnInit {
  createTeamForm!: FormGroup;
  group!: Group;
  team!: Team;
  
  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private teamService: TeamService,
    private route: ActivatedRoute,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: TeamValidators) {
      super();
    }

  ngOnInit(): void {
    this.createTeamForm = this.fb.group({
      name: this.name
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.group = data['group'];
      this.setupForm(this.group);
    });
  }

  setupForm(group: Group): void {
    this.name.setAsyncValidators(this.validators.validateNameNotTaken(group.id))
  }

  create(): void {
    this.team = {...this.createTeamForm.value, groupId: this.group.id};
    this.teamService.createTeam(this.team).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully created')
        this.createTeamForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create team');
      }
    });
  }
}
