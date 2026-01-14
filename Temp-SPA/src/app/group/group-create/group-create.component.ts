import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Group } from 'src/app/core/models/group';
import { Organization } from 'src/app/core/models/organization';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { GroupService } from 'src/app/core/services/group.service';
import { GroupValidators } from '../group-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-group-create',
    templateUrl: './group-create.component.html',
    styleUrl: './group-create.component.scss',
    standalone: false
})

export class GroupCreateComponent extends DestroyableComponent implements OnInit {
  createGroupForm!: FormGroup;
  organization!: Organization;
  group!: Group;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private groupService: GroupService,
    private route: ActivatedRoute,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: GroupValidators) {
      super();
    }

  ngOnInit(): void {
    this.createGroupForm = this.fb.group({
      name: this.name
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.organization = data['organization'];
      this.setupForm(this.organization);
    });
  }

  setupForm(organization: Organization): void {
    this.name.setAsyncValidators(this.validators.validateNameNotTaken(organization.id))
  }

  create(): void {
    this.group = {...this.createGroupForm.value, organizationId: this.organization.id };
    this.groupService.createGroup(this.group).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully created');
        this.createGroupForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create group');
      }
    });

  }
}
