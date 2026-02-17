import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { WorkplaceService } from 'src/app/core/services/workplace.service';
import { WorkplaceValidators } from '../workplace-validators';
import { Workplace } from 'src/app/core/models/workplace';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { takeUntil } from 'rxjs';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';
import { faFile, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FileService } from 'src/app/core/services/file.service';
import { HttpClient } from '@angular/common/http';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'workplace-edit-modal',
    templateUrl: './workplace-edit-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class WorkplaceEditModalComponent extends DestroyableComponent implements OnInit {
  editWorkplaceForm!: FormGroup;
  workplace!: Workplace;
  title?: string;
  workplaceId!: number;
  workplaceFiles: any[] = [];
  profilePictureUrl?: string;

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private workplaceService: WorkplaceService,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private validators: WorkplaceValidators,
    public bsModalRef: BsModalRef,
    private fileService: FileService,
    private http: HttpClient) {
      super();
    }

    fileIcon = faFile;
    downloadIcon = faCloudDownloadAlt;
    removeIcon = faTrashAlt;
  
    fileColumns: TableColumn[] = [
        { key: 'displayName', header: 'File Name', width: '50%' },
        { key: 'fileType', header: 'Type', width: '20%' },
        { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
    ];

    pageNumber = 1;
    pageSize = 5;

    ngOnInit(): void {
      this.editWorkplaceForm = this.fb.group({
        name: this.name
      });

      this.workplaceService.getWorkplace(this.workplaceId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res) => {
          this.workplace = res;
          this.setupForm(this.workplace);
          this.loadWorkplaceFiles();
        },
        error: () => {
          this.alertify.error('Unable to get workplace');
        }
      });
    }

    setupForm(workplace: Workplace): void {
        this.editWorkplaceForm.patchValue({
          name: workplace.name
        });

      this.profilePictureUrl = workplace.profilePictureUrl;
      this.name.addAsyncValidators(this.validators.validateNameNotTaken(workplace.name))
    }
  
    update(): void {
      const workplaceForm = {
        ...this.editWorkplaceForm.value,
        id: this.workplace.id,
        profilePictureUrl: this.profilePictureUrl
      };
      this.workplaceService.updateWorkplace(workplaceForm).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.bsModalRef.content.isSaved = true;
          this.alertify.success('Successfully updated');
        },
        error: () => {
          this.alertify.error('Unable to edit workplace');
        }
      });
    }

    loadWorkplaceFiles(): void {
        const images$ = this.fileService.listImages(undefined, undefined, `workplaces/${this.workplaceId}/images`);
        const documents$ = this.fileService.listDocuments(undefined, undefined, `workplaces/${this.workplaceId}/documents`);
    
        forkJoin([images$, documents$]).pipe(takeUntil(this.destroy$)).subscribe({
          next: ([images, documents]) => {
            const allFiles = [...images, ...documents];
            this.workplaceFiles = allFiles.map(file => ({
                ...file,
                displayName: file.name ? (file.name.split('/').pop() || file.name) : 'Unknown',
                fileTypeDisplay: file.fileType === 'Image' ? 'Image' : 'Document'
            }));
          },
          error: () => {
            this.alertify.error('Failed to load workplace files');
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
        this.workplaceFiles = [...this.workplaceFiles, processed];
      }
    }

    onFileDeleted(path: string): void {
      if (path === this.profilePictureUrl) {
        this.profilePictureUrl = undefined;
      }
      this.workplaceFiles = this.workplaceFiles.filter(f => f.name !== path);

      const maxPage = Math.ceil(this.workplaceFiles.length / this.pageSize) || 1;
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
                      this.workplaceFiles = this.workplaceFiles.filter(f => f.name !== file.name);
                      if (this.profilePictureUrl === file.name) {
                          this.profilePictureUrl = undefined;
                      }
                      
                      const maxPage = Math.ceil(this.workplaceFiles.length / this.pageSize) || 1;
                      if (this.pageNumber > maxPage) {
                          this.pageNumber = maxPage;
                      }
                  },
                  error: () => this.alertify.error('Failed to delete file')
              });
          });
      }

      get paginatedFiles(): any[] {
        const startIndex = (this.pageNumber - 1) * this.pageSize;
        return this.workplaceFiles.slice(startIndex, startIndex + this.pageSize);
    }
  
    onPageChanged(page: number): void {
        this.pageNumber = page;
    }
}
