import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ModeratorListApplication } from 'src/app/core/models/application';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { ApplicationService } from 'src/app/core/services/application.service';

export const applicationModeratorListResolver: ResolveFn<ModeratorListApplication[] | null> = (route: ActivatedRouteSnapshot) => {
    const applicationService = inject(ApplicationService);
    const alertify = inject(AlertifyService);

    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    return applicationService.getTeamApplicationsForModerator(
        route.params['id'],
        user.id).pipe(
        catchError(error => {
            alertify.error(error.error);
            return of(null);
        })
    );
};
