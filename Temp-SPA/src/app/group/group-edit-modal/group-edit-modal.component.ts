import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { Group } from 'src/app/core/models/group';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { GroupService } from 'src/app/core/services/group.service';
import { GroupValidators } from '../group-validators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobResponse } from 'src/app/core/models/blob';
import { faFile, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { FileService } from 'src/app/core/services/file.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-group-edit-modal',
    templateUrl: './group-edit-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class GroupEditModalComponent extends DestroyableComponent implements OnInit {
  fileIcon = faFile;
  downloadIcon = faCloudDownloadAlt;
  removeIcon = faTrashAlt;

  editGroupForm!: FormGroup;
  group!: Group;

  organizationId!: number;
  groupId!: number;
  title?: string;
  groupFiles: any[] = [];
  profilePictureUrl?: string;

  pageNumber = 1;
  pageSize = 5;

  fileColumns: TableColumn[] = [
    { key: 'displayName', header: 'File Name', width: '50%' },
    { key: 'fileType', header: 'Type', width: '20%' },
    { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
  ];

  name = new FormControl('',[
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)
  ]);

  constructor(
    private groupService: GroupService,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private fileService: FileService,
    private http: HttpClient,
    public validators: GroupValidators,
    public bsModalRef: BsModalRef) {
      super();
    }

  ngOnInit(): void {
    this.editGroupForm = this.fb.group({
      name: this.name
    });

    this.groupService.getGroup(this.groupId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: Group) => {
        this.group = res;
        this.setupForm(this.group);
        this.loadGroupFiles();
      },
      error: () => {
        this.alertify.error('Unable to get group');
      }
    });
  }

  setupForm(group: Group): void {
    this.editGroupForm.patchValue({
      name: group.name
    });

    this.profilePictureUrl = group.profilePictureUrl;
    this.name.addAsyncValidators(this.validators.validateNameNotTaken(this.organizationId, group.name));
  }

  loadGroupFiles(): void {
    const images$ = this.fileService.listImages(undefined, undefined, `groups/${this.groupId}/images`);
    const documents$ = this.fileService.listDocuments(undefined, undefined, `groups/${this.groupId}/documents`);

    forkJoin([images$, documents$]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([images, documents]) => {
        const allFiles = [...images, ...documents];
        this.groupFiles = allFiles.map(file => ({
            ...file,
            displayName: file.name ? (file.name.split('/').pop() || file.name) : 'Unknown',
            fileTypeDisplay: file.fileType === 'Image' ? 'Image' : 'Document'
        }));
      },
      error: () => {
        this.alertify.error('Failed to load group files');
      }
    });
  }

  get paginatedFiles(): any[] {
      const startIndex = (this.pageNumber - 1) * this.pageSize;
      return this.groupFiles.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChanged(page: number): void {
      this.pageNumber = page;
  }

  update(): void {
    const groupForm = { ...this.editGroupForm.value };
    this.group.name = groupForm.name;
    this.group.profilePictureUrl = this.profilePictureUrl;
    this.groupService.updateGroup(this.group.id, this.group).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to edit group');
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
          this.groupFiles = [...this.groupFiles, processed];
      }
  }

  onFileDeleted(path: string): void {
    if (path === this.profilePictureUrl) {
      this.profilePictureUrl = undefined;
    }
    this.groupFiles = this.groupFiles.filter(f => f.name !== path);
  }

  downloadFile(file: any): void {
      if (!file || !file.name) {
          this.alertify.error("File path not available");
          return;
      }

      this.fileService.getDownloadUrl(file.name).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
              this.http.get(res.url, { responseType: 'blob' }).subscribe({
                  next: (blob) => {
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = file.displayName || 'download';
                      link.click();
                      window.URL.revokeObjectURL(url);
                  },
                  error: () => {
                      this.alertify.error('Failed to download file');
                  }
              });
          },
          error: () => {
              this.alertify.error('Failed to get download URL');
          }
      });
  }

  removeFile(file: any): void {
      if (!file) return;

      this.alertify.confirm('Are you sure you want to delete this file?', () => {
          this.fileService.delete(file.name).subscribe({
              next: (response) => {
                  if (!response.error) {
                      this.alertify.success('File deleted successfully');
                      this.onFileDeleted(file.name);
                  } else {
                      this.alertify.error(response.errorMessage || 'Delete failed');
                  }
              },
              error: () => {
                  this.alertify.error('Failed to delete file');
              }
          });
      });
  }
}
