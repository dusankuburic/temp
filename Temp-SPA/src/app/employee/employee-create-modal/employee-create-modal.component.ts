import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { takeUntil } from 'rxjs';
import { Employee } from 'src/app/core/models/employee';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { FileService } from 'src/app/core/services/file.service';
import { GroupService } from 'src/app/core/services/group.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobResponse } from 'src/app/core/models/blob';

@Component({
    selector: 'app-employee-create-modal',
    templateUrl: './employee-create-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class EmployeeCreateModalComponent extends DestroyableComponent implements OnInit{
  title?: string;
  createEmployeeForm!: FormGroup;
  employee!: Employee;
  organizationsSelect!: SelectionOption<number>[];
  innerGroupsSelect!: SelectionOption<number>[];
  innerTeamsSelect!: SelectionOption<number>[];
  profilePictureUrl?: string;
  profilePicturePreviewUrl?: string;
  private profilePhotoFile: File | null = null;
  private profilePhotoObjectUrl: string | null = null;

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
    private fileService: FileService,
    private alertify: AlertifyService,
    private fb: FormBuilder,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.createEmployeeForm = this.fb.group({
      firstName: this.firstName,
      lastName: this.lastName,
      organizationId: [null, Validators.required],
      groupId: [null, Validators.required],
      teamId: [null, Validators.required]
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

  loadInnerGroups(id: number | null): void {
    if (id == null)
      return;
    this.organizationService.getInnerGroupsForSelect(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res !== null) {
          this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
            ...res
          ];
          this.createEmployeeForm.get('groupId')?.setValue(null);
          this.innerTeamsSelect = [{value: null, display: '', hidden: true}];
        }
      });
  }

  loadInnerTeams(id: number | null): void {
    if (id == null)
      return;
    this.groupService.getInnerTeamsForSelect(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res !== null) {
          this.innerTeamsSelect = [];
          this.innerTeamsSelect = [
            {value: null, display: '', hidden: true},
            ...res
          ];
          this.createEmployeeForm.get('teamId')?.setValue(null);
        }
      });
  }

  create(): void {
    this.employee = {
      ...this.createEmployeeForm.value,
      profilePictureUrl: this.profilePictureUrl
    };

    this.employeeService.createEmployee(this.employee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created: any) => {
          const createdId: number | undefined = created?.id ?? created?.Id;

          const finishSuccess = () => {
            this.bsModalRef.content.isSaved = true;
            this.alertify.success('Successfully created');
            this.resetFormState();
          };

          if (!createdId || !this.profilePhotoFile) {
            finishSuccess();
            return;
          }

          this.fileService.uploadImage(this.profilePhotoFile).pipe(takeUntil(this.destroy$)).subscribe({
            next: (uploadRes: BlobResponse) => {
              if (uploadRes?.error) {
                this.alertify.error(uploadRes.errorMessage || 'Unable to upload profile photo');
                finishSuccess();
                return;
              }

              const profilePictureUrl = uploadRes?.blob?.name;
              if (!profilePictureUrl) {
                finishSuccess();
                return;
              }

              const updateRequest = {
                id: createdId,
                firstName: this.firstName.value,
                lastName: this.lastName.value,
                teamId: this.createEmployeeForm.get('teamId')?.value,
                profilePictureUrl
              };

              this.employeeService.updateEmployee(updateRequest as any)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => finishSuccess(),
                  error: () => {
                    this.alertify.error('Employee created but failed to set profile photo');
                    finishSuccess();
                  }
                });
            },
            error: () => {
              this.alertify.error('Employee created but failed to upload profile photo');
              finishSuccess();
            }
          });
        },
        error: () => {
          this.alertify.error('Unable to create employee');
        }
      });
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      this.clearProfilePhoto();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.alertify.error('Please select an image file');
      input.value = '';
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.alertify.error('File size exceeds 5MB limit');
      input.value = '';
      return;
    }

    this.profilePhotoFile = file;
    this.setProfilePreviewUrl(URL.createObjectURL(file));
  }

  clearProfilePhoto(): void {
    this.profilePhotoFile = null;
    this.profilePictureUrl = undefined;
    this.setProfilePreviewUrl(undefined);
  }

  private setProfilePreviewUrl(url?: string): void {
    if (this.profilePhotoObjectUrl) {
      URL.revokeObjectURL(this.profilePhotoObjectUrl);
      this.profilePhotoObjectUrl = null;
    }

    this.profilePicturePreviewUrl = url;
    if (url) this.profilePhotoObjectUrl = url;
  }

  private resetFormState(): void {
    this.createEmployeeForm.reset();
    this.clearProfilePhoto();
  }
}
