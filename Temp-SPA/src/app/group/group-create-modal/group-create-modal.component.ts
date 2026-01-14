import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Group } from 'src/app/core/models/group';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { GroupService } from 'src/app/core/services/group.service';
import { GroupValidators } from '../group-validators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';

@Component({
    selector: 'app-group-create-modal',
    templateUrl: './group-create-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class GroupCreateModalComponent extends DestroyableComponent {
  createGroupForm!: FormGroup;
  group!: Group;
  organizationId!: number;
  title?: string;
  groupFiles: BlobDto[] = [];
  profilePictureUrl?: string;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private groupService: GroupService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    private validators: GroupValidators,
    public bsModalRef: BsModalRef) {
      super();
    }


    ngOnInit(): void {
      this.createGroupForm = this.fb.group({
        name: this.name
      });

      this.name.setAsyncValidators(this.validators.validateNameNotTaken(this.organizationId))
    }
  
    create(): void {
      this.group = {
        ...this.createGroupForm.value,
        organizationId: this.organizationId,
        profilePictureUrl: this.profilePictureUrl
      };
      this.groupService.createGroup(this.group).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.bsModalRef.content.isSaved = true;
          this.alertify.success('Successfully created');
          this.createGroupForm.reset();
          this.groupFiles = [];
          this.profilePictureUrl = undefined;
        },
        error: () => {
          this.alertify.error('Unable to create group');
        }
      });
    }

    onFileUploaded(response: BlobResponse): void {
      if (!response.error && response.blob) {
        // For profile picture (images), store the URL
        if (response.blob.fileType === 'Image') {
          this.profilePictureUrl = response.blob.name;
        }
        this.groupFiles = [...this.groupFiles, response.blob];
      }
    }

    onFileDeleted(path: string): void {
      // If deleted file is the profile picture, clear it
      if (path === this.profilePictureUrl) {
        this.profilePictureUrl = undefined;
      }
      this.groupFiles = this.groupFiles.filter(f => f.name !== path);
    }
}
