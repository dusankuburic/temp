import { Routes } from "@angular/router";
import { WorkplaceListComponent } from "./workplace-list/workplace-list.component";
import { workplaceListResolver } from "../core/resolvers/workplace/workplace-list.resolver";
import { WorkplaceEditComponent } from "./workplace-edit/workplace-edit.component";
import { workplaceEditResolver } from "../core/resolvers/workplace/workplace-edit.resolver";
import { WorkplaceCreateComponent } from "./workplace-create/workplace-create.component";

export const workplaceRoutes: Routes = [    
    { 
        path: '', 
        component: WorkplaceListComponent, 
        resolve: { workplaces: workplaceListResolver }
    },
    {
        path: ':id/edit',
        component: WorkplaceEditComponent,
        resolve: { workplace: workplaceEditResolver }
    },
    {
        path: 'create',
        component: WorkplaceCreateComponent
    }  
];
