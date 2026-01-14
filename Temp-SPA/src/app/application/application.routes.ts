import { Routes } from "@angular/router";
import { userGuard } from "../core/guards/user.guard";
import { ApplicationCreateComponent } from "./application-create/application-create.component";
import { applicationCreateResolver } from "../core/resolvers/application/application-create.resolver";
import { ApplicationUserListComponent } from "./application-user-list/application-user-list.component";
import { applicationUserListResolver } from "../core/resolvers/application/application-user-list.resolver";
import { ApplicationUserComponent } from "./application-user/application-user.component";
import { applicationUserResolver } from "../core/resolvers/application/application-user.resolver";
import { moderatorGuard } from "../core/guards/moderator.guard";
import { ApplicationModeratorListComponent } from "./application-moderator-list/application-moderator-list.component";
import { applicationModeratorListResolver } from "../core/resolvers/application/application-moderator-list.resolver";
import { ApplicationModeratorComponent } from "./application-moderator/application-moderator.component";
import { applicationModeratorResolver } from "../core/resolvers/application/application-moderator.resolver";

export const applicationRoutes: Routes = [
    { 
        canActivate: [userGuard],
        path: 'create/:id', 
        component: ApplicationCreateComponent, 
        resolve: { team: applicationCreateResolver }
    },
    { 
        canActivate: [userGuard],
        path: 'list/:id',
        component: ApplicationUserListComponent,
        resolve: { applications: applicationUserListResolver }
    },
    {
        canActivate: [userGuard],
        path: 'user/:id',
        component: ApplicationUserComponent,
        resolve: { application: applicationUserResolver }
    },
    {
        canActivate: [moderatorGuard],
        path: 'list/team/:id',
        component: ApplicationModeratorListComponent,
        resolve: { applications: applicationModeratorListResolver }
    },
    {
        canActivate: [moderatorGuard],
        path: 'moderator/:id',
        component: ApplicationModeratorComponent,
        resolve: { application: applicationModeratorResolver }
    } 
];
