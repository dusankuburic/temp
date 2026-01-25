import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { takeUntil } from 'rxjs';
import { Team } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { TeamService } from 'src/app/core/services/team.service';
import { TeamValidators } from '../team-validators';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';
import { faFile, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';
import { FileService } from 'src/app/core/services/file.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-team-edit-modal',
    templateUrl: './team-edit-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class TeamEditModalComponent extends DestroyableComponent implements OnInit{
  fileIcon = faFile;
  downloadIcon = faCloudDownloadAlt;
  removeIcon = faTrashAlt;

  editTeamForm!: FormGroup;
  team!: Team;

  groupId!: number;
  teamId!: number;
  title?: string;
  teamFiles: any[] = [];

  
  pageNumber = 1;
  pageSize = 5;

  fileColumns: TableColumn[] = [
    { key: 'displayName', header: 'File Name', width: '50%' },
    { key: 'fileType', header: 'Type', width: '20%' },
    { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
  ];

  name = new FormControl('', [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(60)]);

  constructor(
    private teamService: TeamService,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private fileService: FileService,
    private http: HttpClient,
    private validators: TeamValidators,
    public bsModalRef: BsModalRef) {
      super();
    }

  ngOnInit(): void {
    this.editTeamForm = this.fb.group({
      name: this.name
    });

    this.teamService.getTeam(this.teamId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: Team) => {
        this.team = res;
        this.setupForm(this.team);
        this.loadTeamFiles();
      },
      error: () => {
        this.alertify.error('Unable to get team');
      }
    });
  }

  setupForm(team: Team) {
    this.editTeamForm.patchValue({
      name: team.name
    });

    this.name.addAsyncValidators(this.validators.validateNameNotTaken(this.groupId, team.name));
  }

  loadTeamFiles(): void {
    const images$ = this.fileService.listImages(undefined, undefined, `teams/${this.teamId}/images`);
    const documents$ = this.fileService.listDocuments(undefined, undefined, `teams/${this.teamId}/documents`);

    forkJoin([images$, documents$]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([images, documents]) => {
        const allFiles = [...images, ...documents];
        this.teamFiles = allFiles.map(file => ({
            ...file,
            displayName: file.name ? (file.name.split('/').pop() || file.name) : 'Unknown',
            fileTypeDisplay: file.fileType === 'Image' ? 'Image' : 'Document'
        }));
      },
      error: () => {
        this.alertify.error('Failed to load team files');
      }
    });
  }

  get paginatedFiles(): any[] {
      const startIndex = (this.pageNumber - 1) * this.pageSize;
      return this.teamFiles.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChanged(page: number): void {
      this.pageNumber = page;
  }

  update(): void {
    const teamForm = { ...this.editTeamForm.value };
    this.team.name = teamForm.name;
    this.teamService.updateTeam(this.team.id, this.team).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.bsModalRef.content.isSaved = true;
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update team');
      }
    });
  }

  onFileUploaded(response: BlobResponse): void {
    if (!response.error && response.blob) {
      const fileName = response.blob.name || 'Unknown';
      const processed = {
        ...response.blob,
        displayName: fileName.split('/').pop() || fileName,
        fileTypeDisplay: response.blob.fileType === 'Image' ? 'Image' : 'Document'
      };
      
      this.teamFiles = [...this.teamFiles, processed];
    }
  }

  onFileDeleted(path: string): void {
    this.teamFiles = this.teamFiles.filter(f => f.name !== path);
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
