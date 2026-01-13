import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PagedInnerTeams } from '../../models/team';
import { AlertifyService } from '../../services/alertify.service';
import { TeamService } from '../../services/team.service';

export const teamListResolver: ResolveFn<PagedInnerTeams | null> = (route: ActivatedRouteSnapshot) => {
    const teamService = inject(TeamService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    const groupId = parseInt(route.params['id']);
    teamService.resetTeamParams();
    return teamService.getInnerTeams(groupId).pipe(
        catchError(() => {
            alertify.error('Unable to list Teams');
            router.navigate(['']);
            return of(null);
        })
    );
};
