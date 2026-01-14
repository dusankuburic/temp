import { NgModule } from '@angular/core';
import { EmployeeCreateComponent } from './employee-create/employee-create.component';
import { EmployeeEditComponent } from './employee-edit/employee-edit.component';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { RouterModule } from '@angular/router';

import { employeeRoutes } from './employee.routes';
import { SharedModule } from '../shared/shared.module';
import { EmployeeCreateModalComponent } from './employee-create-modal/employee-create-modal.component';
import { EmployeeEditModalComponent } from './employee-edit-modal/employee-edit-modal.component';
import { EmployeeAssignRoleModalComponent } from './employee-assign-role-modal/employee-assign-role-modal.component';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
    imports: [
        SharedModule,
        TabsModule,
        RouterModule.forChild(employeeRoutes),
    ],
    exports: [],
    declarations: [
        EmployeeCreateComponent,
        EmployeeEditComponent,
        EmployeeListComponent,
        EmployeeCreateModalComponent,
        EmployeeEditModalComponent,
        EmployeeAssignRoleModalComponent,
    ],
    providers: []
})
export class EmployeeModule { }
