import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Team } from '../../models/team';
import { AlertifyService } from '../../services/alertify.service';
import { TeamService } from '../../services/team.service';

export const teamEditResolver: ResolveFn<Team | null> = (route: ActivatedRouteSnapshot) => {
    const teamService = inject(TeamService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return teamService.getTeam(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Team');
            router.navigate(['/organizations']);
            return of(null);
        })
    );
};
