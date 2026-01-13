import { Routes } from "@angular/router";
import { EmploymentStatusListComponent } from "./employment-status-list/employment-status-list.component";
import { employmentStatusListResolver } from "../core/resolvers/employment-status/employment-status-list.resolver";
import { EmploymentStatusEditComponent } from "./employment-status-edit/employment-status-edit.component";
import { employmentStatusEditResolver } from "../core/resolvers/employment-status/employment-status-edit.resolver";
import { EmploymentStatusCreateComponent } from "./employment-status-create/employment-status-create.component";

export const employmentStatusRoutes: Routes = [    
    { 
        path: '',
        component: EmploymentStatusListComponent,
        resolve: { employmentStatuses: employmentStatusListResolver }
    },
    { 
        path: ':id/edit',
        component: EmploymentStatusEditComponent,
        resolve: { employmentStatus: employmentStatusEditResolver }
    },
    {
        path: 'create',
        component: EmploymentStatusCreateComponent
    }
];
