import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

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
  animations: [tableAnimations]
})
export class TmpTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() striped = true;
  @Input() hoverable = true;
  @Input() compact = false;
  @Input() stickyHeader = false;
  @Input() emptyMessage = 'No data available';
  @Input() showEmptyState = true;
  @Input() trackBy: string = 'id';
  @Input() loading = false;

  @ContentChild('rowTemplate') rowTemplate!: TemplateRef<any>;
  @ContentChild('emptyTemplate') emptyTemplate!: TemplateRef<any>;

  /** Safe accessor for data to prevent undefined errors */
  get safeData(): any[] {
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

  trackByFn(index: number, item: any): any {
    return item[this.trackBy] ?? index;
  }

  getColumnAlign(column: TableColumn): string {
    return column.align || 'left';
  }
}
