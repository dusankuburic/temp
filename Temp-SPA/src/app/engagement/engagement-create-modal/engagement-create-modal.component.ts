import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { takeUntil } from 'rxjs';
import { Employee } from 'src/app/core/models/employee';
import { Engagement, ExistingEngagement } from 'src/app/core/models/engagement';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { EmploymentStatusService } from 'src/app/core/services/employment-status.service';
import { EngagementService } from 'src/app/core/services/engagement.service';
import { WorkplaceService } from 'src/app/core/services/workplace.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { faFile, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FileService } from 'src/app/core/services/file.service';
import { HttpClient } from '@angular/common/http';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { BlobResponse } from 'src/app/core/models/blob';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-engagement-create-modal',
    templateUrl: './engagement-create-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class EngagementCreateModalComponent extends DestroyableComponent implements OnInit{
  

  title?: string;
  employeeId!: number;
  createEngagementForm!: FormGroup;
  engagement!: Engagement;

  existingEngagements: ExistingEngagement[] = [];
  employee?: Employee;
  workplacesList: SelectionOption[] = [];
  employmentStatusesList: SelectionOption[] = [];

  fileIcon = faFile;
  downloadIcon = faCloudDownloadAlt;
  removeIcon = faTrashAlt;
  employeeFiles: any[] = [];
  pageNumber = 1;
  pageSize = 5;
  fileColumns: TableColumn[] = [
    { key: 'displayName', header: 'File Name', width: '50%' },
    { key: 'fileType', header: 'Type', width: '20%' },
    { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
  ];

  salary = new FormControl('', [
    Validators.required,
    Validators.min(300),
    Validators.max(5000)
  ]);

  dateFrom = new FormControl(null, [Validators.required]);
  dateTo = new FormControl(null, [Validators.required]);

  constructor(
    private engagementService: EngagementService,
    private employmentStatusService: EmploymentStatusService,
    private employeeService: EmployeeService,
    private workplaceService: WorkplaceService,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private fileService: FileService,
    private http: HttpClient,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.createEngagementForm = this.fb.group({
      workplaceId: [null, Validators.required],
      salary: this.salary,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      employmentStatusId: [null, Validators.required]
    });

    this.engagementService.getEngagementForEmployee(this.employeeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: ExistingEngagement[]) => {
        this.existingEngagements = res;
      },
      error: () => {
        this.alertify.error('Unable to get employee data');
      }
    });

    this.loadEmployee();
    this.loadWorkplaces();
    this.loadEmploymentStatuses();
    this.loadEmployeeFiles();
  }

  loadEmployeeFiles(): void {
    const images$ = this.fileService.listImages(undefined, undefined, `employees/${this.employeeId}/images`);
    const documents$ = this.fileService.listDocuments(undefined, undefined, `employees/${this.employeeId}/documents`);

    forkJoin([images$, documents$]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([images, documents]) => {
        const allFiles = [...images, ...documents];
        this.employeeFiles = allFiles.map(file => ({
            ...file,
            displayName: file.name ? (file.name.split('/').pop() || file.name) : 'Unknown',
            fileTypeDisplay: file.fileType === 'Image' ? 'Image' : 'Document'
        }));
      },
      error: () => {
        this.alertify.error('Failed to load employee files');
      }
    });
  }

  get paginatedFiles(): any[] {
      const startIndex = (this.pageNumber - 1) * this.pageSize;
      return this.employeeFiles.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChanged(page: number): void {
      this.pageNumber = page;
  }

  onFileUploaded(response: BlobResponse): void {
      if (!response.error && response.blob) {
          const fileName = response.blob.name || 'Unknown';
          const processed = {
              ...response.blob,
              displayName: fileName.split('/').pop() || fileName,
              fileTypeDisplay: response.blob.fileType === 'Image' ? 'Image' : 'Document'
          };
          this.employeeFiles = [...this.employeeFiles, processed];
      }
  }

  onFileDeleted(path: string): void {
      this.employeeFiles = this.employeeFiles.filter(f => f.name !== path);
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
          this.fileService.delete(file.name).pipe(takeUntil(this.destroy$)).subscribe({
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

  loadEmployee(): void {
    this.employeeService.getEmployee(this.employeeId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.employee = res;
        },
        error: () => {
          this.alertify.error('Unable get employee')
        }
      });
  }

  loadWorkplaces(): void {
    this.workplaceService.getWorkplacesForSelect().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.workplacesList = [
          {value: null, display: '', disabled: true},
          ...res
        ];
      },
      error: () => {
        this.alertify.error('Unable to list workplaces');
      }
    });
  }

  loadEmploymentStatuses(): void {
    this.employmentStatusService.getEmploymentStatusesForSelect().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.employmentStatusesList = [
          {value: null, display: '', disabled: true},
          ...res
        ];
      },
      error: () => {
        this.alertify.error('Unable to list Employment statuses');
      }
    })
  }

  loadEngagements(): void {
    this.engagementService.getEngagementForEmployee(this.employeeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.existingEngagements = res;
      },
      error: () => {
        this.alertify.error('Unable to list engagements');
      }
    });
  }

  create(): void {
    this.engagement = { ...this.createEngagementForm.value, employeeId: this.employeeId };
    this.engagementService.createEngagement(this.engagement).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.loadEngagements();
        this.alertify.success('Successfully created');
        this.createEngagementForm.reset();
      },
      error: () => {
        this.alertify.error('Unable to create engagement');
      }
    });
  } 
}
