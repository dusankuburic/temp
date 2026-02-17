import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'tmp-pagination',
    templateUrl: './tmp-pagination.component.html',
    styleUrls: ['./tmp-pagination.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class TmpPaginationComponent {
  @Input() totalCount?: number;
  @Input() pageSize?: number;
  @Input() pageNumber?: number;
  
  @Output() pageChanged = new EventEmitter<number>();

  onPageChanged(event: any) {
    this.pageChanged.emit(event.page);
  }
}
