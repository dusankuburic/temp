import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs';
import { Organization } from 'src/app/core/models/organization';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';

@Component({
    selector: 'app-organization-edit',
    templateUrl: './organization-edit.component.html',
    styleUrl: './organization-edit.component.scss',
    standalone: false
})
export class OrganizationEditComponent extends DestroyableComponent implements OnInit {
  editOrganizationForm!: FormGroup;
  organization!: Organization;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private organizationService: OrganizationService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private alertify: AlertifyService) {
    super();
  }

  ngOnInit(): void {
    this.editOrganizationForm = this.fb.group({
      name: this.name
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.organization = data['organization'];
      this.setupForm(this.organization);
    });
  }

  setupForm(organization: Organization): void {
    if (this.editOrganizationForm)
      this.editOrganizationForm.reset();

      this.editOrganizationForm.patchValue({
        name: organization.name
      });
  }

  update(): void {
    const request: Organization = {...this.editOrganizationForm.value, id: this.organization.id};
    this.organizationService.updateOrganization(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update organization');
      }
    });
  }
}
