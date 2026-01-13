import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Organization } from 'src/app/core/models/organization';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { OrganizationValidators } from '../organization-validators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';

@Component({
    selector: 'app-organization-create-modal',
    templateUrl: './organization-create-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class OrganizationCreateModalComponent extends DestroyableComponent implements OnInit {
  createOrganizationForm!: FormGroup;
  organization!: Organization;
  title?: string;
  organizationFiles: BlobDto[] = [];
  profilePictureUrl?: string;

  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)],
    [this.validators.validateNameNotTaken()]);

  constructor(
    private organizationService: OrganizationService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: OrganizationValidators,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.createOrganizationForm = this.fb.group({
      name: this.name
    });
  }

  create(): void {
    this.organization = {
      ...this.createOrganizationForm.value,
      profilePictureUrl: this.profilePictureUrl
    };
    this.organizationService.createOrganization(this.organization).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.alertify.success('Successfully created');
        this.createOrganizationForm.reset();
        this.organizationFiles = [];
        this.profilePictureUrl = undefined;
      },
      error: () => {
        this.alertify.error('Unable to create organization');
      }
    });
  }

  onFileUploaded(response: BlobResponse): void {
    if (!response.error && response.blob) {
      if (response.blob.fileType === 'Image') {
        this.profilePictureUrl = response.blob.name;
      }
      this.organizationFiles = [...this.organizationFiles, response.blob];
    }
  }

  onFileDeleted(path: string): void {
    if (path === this.profilePictureUrl) {
      this.profilePictureUrl = undefined;
    }
    this.organizationFiles = this.organizationFiles.filter(f => f.name !== path);
  }
}
