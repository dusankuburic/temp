import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef } from '@angular/core';

export interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  colspan?: number;
}

import { tableAnimations } from '../../../core/animations/table.animations';

@Component({
  selector: 'tmp-table',
  templateUrl: './tmp-table.component.html',
  styleUrls: ['./tmp-table.component.scss'],
  standalone: false,
  animations: [tableAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TmpTableComponent<T = any> {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() striped = true;
  @Input() hoverable = true;
  @Input() compact = false;
  @Input() stickyHeader = false;
  @Input() emptyMessage = 'No data available';
  @Input() showEmptyState = true;
  @Input() trackBy: keyof T | 'id' = 'id';
  @Input() loading = false;
  @Input() disableAnimations = false;

  @ContentChild('rowTemplate') rowTemplate!: TemplateRef<{ $implicit: T, index: number, rowIndex: number }>;
  @ContentChild('emptyTemplate') emptyTemplate!: TemplateRef<void>;

  get safeData(): T[] {
    return this.data ?? [];
  }

  get tableClasses(): string {
    const classes = ['tmp-table'];
    if (this.striped) classes.push('tmp-table-striped');
    if (this.hoverable) classes.push('tmp-table-hoverable');
    if (this.compact) classes.push('tmp-table-compact');
    if (this.stickyHeader) classes.push('tmp-table-sticky-header');
    return classes.join(' ');
  }

  trackByFn(index: number, item: T): string | number {
    if (this.trackBy in (item as object)) {
      const value = (item as any)[this.trackBy];
      return value ?? index;
    }
    return index;
  }

  getColumnAlign(column: TableColumn): string {
    return column.align || 'left';
  }
}
