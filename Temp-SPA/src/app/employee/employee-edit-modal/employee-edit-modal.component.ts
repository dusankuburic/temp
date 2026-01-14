import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faFile, faMinus, faPlus, faCloudDownloadAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { firstValueFrom, lastValueFrom, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs';
import { Employee } from 'src/app/core/models/employee';
import { Group, ModeratorGroups } from 'src/app/core/models/group';
import { ModeratorMin } from 'src/app/core/models/moderator';
import { FullTeam } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EmployeeService } from 'src/app/core/services/employee.service';
import { GroupService } from 'src/app/core/services/group.service';
import { OrganizationService } from 'src/app/core/services/organization.service';
import { TeamService } from 'src/app/core/services/team.service';
import { FileService } from 'src/app/core/services/file.service';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';
import { DestroyableComponent } from 'src/app/core/base/destroyable.component';
import { BlobDto, BlobResponse } from 'src/app/core/models/blob';
import { TableColumn } from 'src/app/shared/components/tmp-table/tmp-table.component';

@Component({
    selector: 'app-employee-edit-modal',
    templateUrl: './employee-edit-modal.component.html',
    styleUrls: ['../../shared/styles/modal.scss'],
    standalone: false
})
export class EmployeeEditModalComponent extends DestroyableComponent implements OnInit { 
  minusIcon = faMinus;
  plusIcon = faPlus;
  fileIcon = faFile;
  downloadIcon = faCloudDownloadAlt;
  removeIcon = faTrashAlt;

  title?: string;
  employeeId!: number;
  editEmployeeForm!: FormGroup;
  employeeFiles: any[] = [];
  
  pageNumber = 1;
  pageSize = 5;

  get paginatedFiles(): any[] {
      const start = (this.pageNumber - 1) * this.pageSize;
      return this.employeeFiles.slice(start, start + this.pageSize);
  }
  employee!: Employee;
  username?: string;
  fullTeam!: FullTeam;
  organizationsSelect!: SelectionOption[];
  innerGroupsSelect!: SelectionOption[];
  innerTeamsSelect!: SelectionOption[];
  currentModeratorGroups!: Group[];
  freeModeratorGroups!: Group[];

  fileColumns: TableColumn[] = [
      { key: 'displayName', header: 'File Name', width: '50%' },
      { key: 'fileType', header: 'Type', width: '20%' },
      { key: 'actions', header: 'Actions', align: 'center', width: '30%' }
  ];

  profilePictureUrl?: string;
  profilePictureDisplayUrl?: string;
  isSaved = false;

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
    private teamService: TeamService,
    private fileService: FileService,
    private fb: FormBuilder,
    private alertify: AlertifyService,
    private http: HttpClient,
    public bsModalRef: BsModalRef) {
    super();
  }

  ngOnInit(): void {
    this.editEmployeeForm = this.fb.group({
      firstName: this.firstName,
      lastName: this.lastName,
      organizationId: [null, Validators.required],
      groupId: [null, Validators.required],
      teamId: [null, Validators.required]
    });
    this.editEmployeeForm.get('organizationId')?.disable();

    this.employeeService.getEmployee(this.employeeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: Employee) => {
        this.employee = res;
        this.setupForm(this.employee);

        if (this.employee.role !== 'None') {
          this.loadEmployeeUsername(this.employee.id);
        }

        if (this.employee.role === 'Moderator') {
          this.loadModeratorGroups(this.employee.teamId, this.employee.id, true);
        } else {
          this.loadFullTeam(this.employee.teamId);
        }

        this.loadEmployeeFiles();
      },
      error: () => {
        this.alertify.error('Unable to get employee');
      }
    });

    this.organizationService.getOrganizationsForSelect()
      .pipe(takeUntil(this.destroy$)).subscribe(res => {
        this.organizationsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
      });
  }

  setupForm(employee: Employee): void {
      this.editEmployeeForm.patchValue({
        firstName: employee.firstName,
        lastName: employee.lastName
      });
      this.profilePictureUrl = employee.profilePictureUrl;
      
      if (this.profilePictureUrl) {
          this.fileService.getDownloadUrl(this.profilePictureUrl).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.profilePictureDisplayUrl = res.url;
                },
                error: () => {
                  console.error('Failed to load profile picture URL');
                }
            });
      }
  }
  
  loadEmployeeUsername(employeeId: number) {
    this.employeeService.getEmployeeUsername(employeeId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.username = res.username;
      },
      error: () => {
        this.alertify.error('Unable to get employee username');
      }
    })
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

  loadFullTeam(id: number): void {
    this.teamService.getFullTeam(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.fullTeam = res;
      this.loadOrgData(this.fullTeam);
    });
  }

  async loadModeratorGroups(id: number, EmployeeId: number, isOnInit?: boolean) {
    try {
      const fullTeam = await lastValueFrom(this.teamService.getFullTeam(id));
      this.fullTeam = fullTeam;
      if (isOnInit)
        this.loadOrgData(this.fullTeam);

      const moderator = await firstValueFrom(this.employeeService.getEmployee(EmployeeId));
      const moderatorMin: ModeratorMin = {id: moderator.id};

      try {
        const currModerGroup = await firstValueFrom(this.groupService.getModeratorGroups(moderator.id));
        this.currentModeratorGroups = currModerGroup;
      } catch (error: any) {
        this.currentModeratorGroups = [];
        this.alertify.error(error.error);
      }

      try {
        const res = await firstValueFrom(this.groupService.getModeratorFreeGroups(this.fullTeam.organizationId, moderatorMin));
        this.freeModeratorGroups = res;
      } catch (error: any) {
        this.alertify.error(error.error);
      }
    } catch (error) {
      this.alertify.error('Failed to load moderator groups');
    }
  }

  loadOrgData(fullTeam: FullTeam) {
    this.editEmployeeForm.get('organizationId')?.setValue(fullTeam.organizationId);
    this.organizationService.getInnerGroupsForSelect(fullTeam.organizationId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
      }
    });

    this.editEmployeeForm.get('groupId')?.setValue(fullTeam.groupId);
    this.groupService.getInnerTeamsForSelect(fullTeam.groupId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerTeamsSelect = [];
        this.innerTeamsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
      }
    });
    this.editEmployeeForm.get('teamId')?.setValue(fullTeam.teamId);
  }

  loadInnerGroups(id: number | null): void {
    if (id == null)
      return;
    this.organizationService.getInnerGroupsForSelect(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerGroupsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
        this.editEmployeeForm.get('teamId')?.setValue(null);
      }
    });
  }

  loadInnerTeams(id: number | null): void {
    if (id == null)
      return;
    this.groupService.getInnerTeamsForSelect(id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (res !== null) {
        this.innerTeamsSelect = [];
        this.innerTeamsSelect = [
          {value: null, display: '', hidden: true},
          ...res
        ];
        this.editEmployeeForm.get('teamId')?.setValue(null);
      }
    });
  }

  updateGroup(moderatorId: number, newGroupId: number): void {
    const moderatorGroups = {} as ModeratorGroups;
    moderatorGroups.groups = [];

    this.currentModeratorGroups.forEach((elem) => {
      moderatorGroups.groups.push(elem.id);
    });

    if (!moderatorGroups.groups.includes(newGroupId)) {
      moderatorGroups.groups.push(newGroupId);
    } else {
      moderatorGroups.groups = moderatorGroups.groups
      .filter(elem => elem !== newGroupId);
    }

    this.groupService.updateModeratorGroups(moderatorId, moderatorGroups.groups).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loadModeratorGroups(this.employee.teamId, this.employee.id);
        this.alertify.success('Success');
      },
      error: () => {
        this.alertify.error('Unable to manage groups');
      }
    });
  }

  update(): void {
    const employeeForm = {
      ...this.editEmployeeForm.value,
      id: this.employee.id,
      profilePictureUrl: this.profilePictureUrl
    };

    if (employeeForm.teamId == null) {
      employeeForm.teamId = this.employee.teamId;
    }

    this.employeeService.updateEmployee(employeeForm).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaved = true;
        this.alertify.success('Successfully updated');
      },
      error: () => {
        this.alertify.error('Unable to update employee');
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
          this.employeeFiles = [...this.employeeFiles, processed];
      }
  }

  onFileDeleted(path: string): void {
      if (path === this.profilePictureUrl) {
          this.profilePictureUrl = undefined;
          this.profilePictureDisplayUrl = undefined;
      }
      this.employeeFiles = this.employeeFiles.filter(f => f.name !== path);
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
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

    this.profilePictureDisplayUrl = URL.createObjectURL(file);

    this.fileService.uploadImage(file).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: BlobResponse) => {
            if (res.blob) {
                this.profilePictureUrl = res.blob.name;
                const processed = {
                  ...res.blob,
                  displayName: res.blob.name?.split('/').pop() || res.blob.name,
                  fileTypeDisplay: 'Image'
                };
                this.employeeFiles = [...this.employeeFiles, processed];
            } else {
                this.alertify.error('Upload succeeded but no blob returned');
            }
        },
        error: () => {
             this.alertify.error('Unable to upload profile photo');
             input.value = '';
        }
    });
  }

  clearProfilePhoto(): void {
    this.profilePictureUrl = undefined;
    this.profilePictureDisplayUrl = undefined;
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
                  this.employeeFiles = this.employeeFiles.filter(f => f.name !== file.name);
                  if (this.profilePictureUrl === file.name) {
                      this.profilePictureUrl = undefined;
                      this.profilePictureDisplayUrl = undefined;
                  }
              },
              error: () => this.alertify.error('Failed to delete file')
          });
      });
  }

  onPageChanged(page: number): void {
      this.pageNumber = page;
  }
}
