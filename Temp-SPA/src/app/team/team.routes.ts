import { Routes } from "@angular/router";
import { authGuard } from "../core/guards/auth.guard";
import { TeamListComponent } from "./inner-team-list/inner-team-list.component";
import { teamListResolver } from "../core/resolvers/team/team-list.resolver";
import { TeamCreateComponent } from "./team-create/team-create.component";
import { teamCreateResolver } from "../core/resolvers/team/team-create.resolver";
import { TeamEditComponent } from "./team-edit/team-edit.component";
import { teamEditResolver } from "../core/resolvers/team/team-edit.resolver";
import { moderatorGuard } from "../core/guards/moderator.guard";
import { AssignedInnerTeamsComponent } from "./assigned-inner-teams/assigned-inner-teams.component";

export const teamRoutes: Routes = [
    {
        canActivate: [authGuard],
        path: 'group/:id',
        component: TeamListComponent,
        resolve: { innerteams: teamListResolver }
    },
    {
        canActivate: [authGuard],
        path: 'create/group/:id',
        component: TeamCreateComponent,
        resolve: { group: teamCreateResolver }
    },
    {
        canActivate: [authGuard],
        path: ':id/edit/:groupId/group',
        component: TeamEditComponent,
        resolve: { team: teamEditResolver}
    },
    { 
        canActivate: [moderatorGuard],
        path: ':id/assigned-groups',
        component: AssignedInnerTeamsComponent,
        resolve: { innerteams: teamListResolver }
    }
];
