
import { NgModule } from '@angular/core';
import { WorkplaceCreateComponent } from './workplace-create/workplace-create.component';
import { WorkplaceEditComponent } from './workplace-edit/workplace-edit.component';
import { WorkplaceListComponent } from './workplace-list/workplace-list.component';
import { RouterModule } from '@angular/router';
import { workplaceRoutes } from './workplace.routes';
import { SharedModule } from '../shared/shared.module';
import { WorkplaceCreateModalComponent } from './workplace-create-modal/workplace-create-modal.component';
import { WorkplaceEditModalComponent } from './workplace-edit-modal/workplace-edit-modal.component';

import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
    imports: [
        SharedModule,
        TabsModule,
        RouterModule.forChild(workplaceRoutes)
    ],
    exports: [],
    declarations: [
        WorkplaceCreateComponent,
        WorkplaceEditComponent,
        WorkplaceListComponent,
        WorkplaceCreateModalComponent,
        WorkplaceEditModalComponent
    ],
    providers: []
})
export class WorkplaceModule { }
