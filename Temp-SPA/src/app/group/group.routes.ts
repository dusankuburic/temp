import { Routes } from "@angular/router";
import { authGuard } from "../core/guards/auth.guard";
import { GroupListComponent } from "./inner-group-list/inner-group-list.component";
import { groupListResolver } from "../core/resolvers/group/group-list.resolver";
import { GroupCreateComponent } from "./group-create/group-create.component";
import { groupCreateResolver } from "../core/resolvers/group/group-create.resolver";
import { GroupEditComponent } from "./group-edit/group-edit.component";
import { groupEditResolver } from "../core/resolvers/group/group-edit.resolver";
import { moderatorGuard } from "../core/guards/moderator.guard";
import { AssignedGroupsComponent } from "./assigned-groups/assigned-groups.component";
import { moderatorAssignedGroupsResolver } from "../core/resolvers/group/moderator-assigned-groups.resolver";

export const groupRoutes: Routes = [    
    { 
        canActivate: [authGuard],
        path: 'organization/:id', 
        component: GroupListComponent, 
        resolve: { innergroups: groupListResolver }
    },
    { 
        canActivate: [authGuard],
        path: 'create/organization/:id', 
        component: GroupCreateComponent, 
        resolve: { organization: groupCreateResolver }
    },
    { 
        canActivate: [authGuard],
        path: ':id/edit/:organizationId/organization', 
        component: GroupEditComponent, 
        resolve: { group: groupEditResolver }
    },
    {
        canActivate: [moderatorGuard],
        path: ':id/assigned-groups',
        component: AssignedGroupsComponent,
        resolve: { groups: moderatorAssignedGroupsResolver }
    }
];
