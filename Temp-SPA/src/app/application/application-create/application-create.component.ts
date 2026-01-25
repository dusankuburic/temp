import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { CreateApplication } from 'src/app/core/models/application';
import { Team } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { ApplicationService } from 'src/app/core/services/application.service';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-application-create',
    templateUrl: './application-create.component.html',
    styleUrl: './application-create.component.scss',
    standalone: false
})
export class ApplicationCreateComponent extends DestroyableComponent implements OnInit {
  createApplicationForm!: FormGroup;
  application!: CreateApplication;
  team!: Team;
  user!: any;

  constructor(
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private alertify: AlertifyService,
    private fb: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.team = data['team'];
    });
    this.user = JSON.parse(localStorage.getItem('user') ?? '{}');
    this.createForm();
  }

  createForm(): void {
    this.createApplicationForm = this.fb.group({
      category: ['', Validators.required],
      content: ['', [ Validators.required, Validators.maxLength(600)]]
    });
  }

  create(): void {
    this.application = {...this.createApplicationForm.value, teamId: this.team.id, userId: this.user.id};
    this.applicationService.createApplication(this.application).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully created');
        this.createApplicationForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create application');
      }
    });
  }
}
