import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faCloudUpload, faFile, faImage, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { BlobDto, BlobResponse, FileType } from 'src/app/core/models/blob';
import { FileService } from 'src/app/core/services/file.service';
import { AlertifyService } from 'src/app/core/services/alertify.service';

@Component({
  selector: 'tmp-file-upload',
  templateUrl: './tmp-file-upload.component.html',
  styleUrls: ['./tmp-file-upload.component.scss'],
  standalone: false
})
export class TmpFileUploadComponent {
  uploadIcon = faCloudUpload;
  fileIcon = faFile;
  imageIcon = faImage;
  deleteIcon = faTrash;
  spinnerIcon = faSpinner;

  @Input() label = 'Upload File';
  @Input() fileType: FileType = 'Document';
  @Input() accept = '*/*';
  @Input() maxSizeMB = 10;
  @Input() employeeId?: number;
  @Input() uploadedFiles: BlobDto[] = [];
  @Input() customFolder?: string;
  @Input() compact = false;

  @Output() fileUploaded = new EventEmitter<BlobResponse>();
  @Output() fileDeleted = new EventEmitter<string>();

  selectedFile: File | null = null;
  isUploading = false;
  isDragOver = false;

  constructor(
    private fileService: FileService,
    private alertify: AlertifyService
  ) {}

  get acceptTypes(): string {
    if (this.fileType === 'Image') {
      return 'image/*';
    }
    return this.accept;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.alertify.error(`File size exceeds ${this.maxSizeMB}MB limit`);
      return;
    }

    if (this.fileType === 'Image' && !file.type.startsWith('image/')) {
      this.alertify.error('Please select an image file');
      return;
    }

    this.selectedFile = file;
    this.uploadFile();
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;

    const upload$ = this.fileType === 'Image'
      ? this.fileService.uploadImage(this.selectedFile, undefined, this.customFolder)
      : this.fileService.uploadDocument(this.selectedFile, undefined, this.customFolder);

    upload$.subscribe({
      next: (response: BlobResponse) => {
        this.isUploading = false;
        if (!response.error) {
          this.alertify.success('File uploaded successfully');
          this.fileUploaded.emit(response);
          this.uploadedFiles = [...this.uploadedFiles, response.blob];
        } else {
          this.alertify.error(response.errorMessage || 'Upload failed');
        }
        this.selectedFile = null;
      },
      error: () => {
        this.isUploading = false;
        this.alertify.error('Failed to upload file');
        this.selectedFile = null;
      }
    });
  }

  deleteFile(path: string): void {
    this.fileService.delete(path).subscribe({
      next: (response: BlobResponse) => {
        if (!response.error) {
          this.alertify.success('File deleted successfully');
          this.uploadedFiles = this.uploadedFiles.filter(f => f.folderPath !== path && f.name !== path);
          this.fileDeleted.emit(path);
        } else {
          this.alertify.error(response.errorMessage || 'Delete failed');
        }
      },
      error: () => {
        this.alertify.error('Failed to delete file');
      }
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileName(blob: BlobDto): string {
    if (blob.name) {
      return blob.name.split('/').pop() || blob.name;
    }
    return 'Unknown file';
  }

  get filteredFiles(): BlobDto[] {
    return this.uploadedFiles.filter(f => f.fileType === this.fileType);
  }
}
