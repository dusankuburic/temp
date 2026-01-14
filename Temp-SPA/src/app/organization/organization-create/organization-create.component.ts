import { Component, OnInit } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Organization } from 'src/app/core/models/organization';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { OrganizationValidators } from '../organization-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-organization-create',
    templateUrl: './organization-create.component.html',
    styleUrl: './organization-create.component.scss',
    standalone: false
})
export class OrganizationCreateComponent extends DestroyableComponent implements OnInit {
  createOrganizationForm!: FormGroup;
  organization!: Organization;

  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)],
    [this.validators.validateNameNotTaken()]);

  constructor(
    private organizationService: OrganizationService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: OrganizationValidators) {
    super();
  }

  ngOnInit(): void {
    this.createOrganizationForm = this.fb.group({
      name: this.name
    });
  }

  create(): void {
    this.organization = {...this.createOrganizationForm.value};
    this.organizationService.createOrganization(this.organization).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully created');
        this.createOrganizationForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create organization');
      }
    });
  }
}
