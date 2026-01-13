import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Team } from 'src/app/core/models/team';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { TeamService } from 'src/app/core/services/team.service';

export const applicationCreateResolver: ResolveFn<Team | null> = (route: ActivatedRouteSnapshot) => {
    const teamService = inject(TeamService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return teamService.getUserTeam(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get user team');
            router.navigate(['']);
            return of(null);
        })
    );
};
