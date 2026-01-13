import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { takeUntil } from 'rxjs';
import { Organization } from 'src/app/core/models/organization';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { OrganizationValidators } from '../organization-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';
import { faFile, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FileService } from 'src/app/core/services/file.service';
import { HttpClient } from '@angular/common/http';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-organization-edit-modal',
    templateUrl: './organization-edit-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class OrganizationEditModalComponent extends DestroyableComponent implements OnInit {
  fileIcon = faFile;
  downloadIcon = faCloudDownloadAlt;
  removeIcon = faTrashAlt;

  fileColumns: TableColumn[] = [
      { key: 'displayName', header: 'File Name', width: '50%' },
      { key: 'fileType', header: 'Type', width: '20%' },
      { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
  ];

  editOrganizationForm!: FormGroup;
  organization!: Organization;
  title?: string;
  organizationId!: number;
  organizationFiles: any[] = [];
  profilePictureUrl?: string;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private organizationService: OrganizationService,
    private fileService: FileService,
    private http: HttpClient,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private validators: OrganizationValidators,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.editOrganizationForm = this.fb.group({
      name: this.name
    });

    this.organizationService.getOrganization(this.organizationId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.organization = res;
        this.setupForm(this.organization);
        this.loadOrganizationFiles();
      },
      error: () => {
        this.alertify.error('Unable to get organization');
      }
    });
  }

  setupForm(organization: Organization): void {
      this.editOrganizationForm.patchValue({
        name: organization.name
      });

      this.profilePictureUrl = organization.profilePictureUrl;
      this.name.addAsyncValidators(this.validators.validateNameNotTaken(organization.name))
  }

  loadOrganizationFiles(): void {
    const images$ = this.fileService.listImages(undefined, undefined, `organizations/${this.organizationId}/images`);
    const documents$ = this.fileService.listDocuments(undefined, undefined, `organizations/${this.organizationId}/documents`);

    forkJoin([images$, documents$]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([images, documents]) => {
        const allFiles = [...images, ...documents];
        this.organizationFiles = allFiles.map(file => ({
            ...file,
            displayName: file.name ? (file.name.split('/').pop() || file.name) : 'Unknown',
            fileTypeDisplay: file.fileType === 'Image' ? 'Image' : 'Document'
        }));
      },
      error: () => {
        this.alertify.error('Failed to load organization files');
      }
    });
  }

  update(): void {
    const request: Organization = {
      ...this.editOrganizationForm.value,
      id: this.organization.id,
      profilePictureUrl: this.profilePictureUrl
    };
    this.organizationService.updateOrganization(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update organization');
      }
    });
  }

  onFileUploaded(response: BlobResponse): void {
      if (!response.error && response.blob) {
          if (response.blob.fileType === 'Image') {
              this.profilePictureUrl = response.blob.name;
          }
          const fileName = response.blob.name || 'Unknown';
          const processed = {
              ...response.blob,
              displayName: fileName.split('/').pop() || fileName,
              fileTypeDisplay: response.blob.fileType === 'Image' ? 'Image' : 'Document'
          };
          this.organizationFiles = [...this.organizationFiles, processed];
      }
  }

  onFileDeleted(path: string): void {
    if (path === this.profilePictureUrl) {
      this.profilePictureUrl = undefined;
    }
    this.organizationFiles = this.organizationFiles.filter(f => f.name !== path);
    
    const maxPage = Math.ceil(this.organizationFiles.length / this.pageSize) || 1;
    if (this.pageNumber > maxPage) {
        this.pageNumber = maxPage;
    }
  }

  downloadFile(file: any): void {
    if (!file.name) {
        this.alertify.error('File path not available');
        return;
    }

    this.fileService.getDownloadUrl(file.name).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
            this.http.get(res.url, { responseType: 'blob' }).subscribe({
                next: (blob) => {
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = file.displayName || 'download';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
                },
                error: () => this.alertify.error('Failed to download file content')
            });
        },
        error: () => this.alertify.error('Failed to get download URL')
    });
  }

  removeFile(file: any): void {
      if (!file.name) return;
      
      this.alertify.confirm('Are you sure you want to delete this file?', () => {
          this.fileService.delete(file.name).pipe(takeUntil(this.destroy$)).subscribe({
              next: () => {
                  this.alertify.success('File deleted');
                  this.organizationFiles = this.organizationFiles.filter(f => f.name !== file.name);
                  if (this.profilePictureUrl === file.name) {
                      this.profilePictureUrl = undefined;
                  }
                  
                  const maxPage = Math.ceil(this.organizationFiles.length / this.pageSize) || 1;
                  if (this.pageNumber > maxPage) {
                      this.pageNumber = maxPage;
                  }
              },
              error: () => this.alertify.error('Failed to delete file')
          });
      });
  }

  pageNumber = 1;
  pageSize = 5;

  get paginatedFiles(): any[] {
      const startIndex = (this.pageNumber - 1) * this.pageSize;
      return this.organizationFiles.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChanged(page: number): void {
      this.pageNumber = page;
  }
}
