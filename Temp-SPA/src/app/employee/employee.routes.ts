import { Routes } from "@angular/router";
import { EmployeeListComponent } from "./employee-list/employee-list.component";
import { EmployeeEditComponent } from "./employee-edit/employee-edit.component";
import { employeeEditResolver } from "../core/resolvers/employee/employee-edit.resolver";
import { EmployeeCreateComponent } from "./employee-create/employee-create.component";
import { employeeListResolver } from "../core/resolvers/employee/employee-list.resolver";

export const employeeRoutes: Routes = [
    { 
        path: '', 
        component: EmployeeListComponent, 
        resolve: {employees: employeeListResolver}
    },
    { 
        path: ':id/edit', 
        component: EmployeeEditComponent,
        resolve: { employee: employeeEditResolver }
    },
    {
        path: 'create',
        component: EmployeeCreateComponent
    }
];
