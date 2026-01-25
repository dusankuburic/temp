import { Routes } from "@angular/router";
import { OrganizationListComponent } from "./organization-list/organization-list.component";

import { OrganizationEditComponent } from "./organization-edit/organization-edit.component";
import { organizationEditResolver } from "../core/resolvers/organization/organization-edit.resolver";
import { OrganizationCreateComponent } from "./organization-create/organization-create.component";

export const organizationRoutes: Routes = [    
    { 
        path: '', 
        component: OrganizationListComponent 
    },
    {
        path: ':id/edit',
        component: OrganizationEditComponent,
        resolve: { organization: organizationEditResolver }
    }, 
    {
        path: 'create',
        component: OrganizationCreateComponent
    }
];
