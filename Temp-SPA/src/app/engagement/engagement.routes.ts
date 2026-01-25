import { Routes } from "@angular/router";
import { authGuard } from "../core/guards/auth.guard";
import { EngagementWithoutEmployeeListComponent } from "./engagement-without-employee-list/engagement-without-employee-list.component";
import { engagementWithoutEmployeeResolver } from "../core/resolvers/engagement/engagement-without-employee-list.resolver";
import { EngagementCreateComponent } from "./engagement-create/engagement-create.component";
import { engagementCreateResolver } from "../core/resolvers/engagement/engagement-create.resolver";
import { EngagementWithEmployeeListComponent } from "./engagement-with-employee-list/engagement-with-employee-list.component";
import { engagementWithEmployeeResolver } from "../core/resolvers/engagement/engagement-with-employee-list.resolver";
import { userGuard } from "../core/guards/user.guard";
import { EngagementUserListComponent } from "./engagement-user-list/engagement-user-list.component";
import { engagementUserListResolver } from "../core/resolvers/engagement/engagement-user-list.resolver";

export const engagementRoutes: Routes = [
    { 
        canActivate: [authGuard],
        path: '', component: EngagementWithoutEmployeeListComponent, 
        resolve: { employeesWithout: engagementWithoutEmployeeResolver }
    },
    { 
        canActivate: [authGuard],
        path: 'create/:id',
        component: EngagementCreateComponent,
        resolve: { employeeData: engagementCreateResolver }
    },
    {
        canActivate: [authGuard],
        path: 'with-employee',
        component: EngagementWithEmployeeListComponent,
        resolve: { employeesWith: engagementWithEmployeeResolver }
    },
    {
        canActivate: [authGuard],
        path: 'without-employee',
        component: EngagementWithoutEmployeeListComponent,
        resolve: {employeesWithout: engagementWithoutEmployeeResolver}
    },
    {
        canActivate: [userGuard],
        path: 'user-list/:id',
        component: EngagementUserListComponent,
        resolve: { engagements: engagementUserListResolver },
    }
];
