import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserEngagement } from 'src/app/core/models/engagement';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { EngagementService } from 'src/app/core/services/engagement.service';

export const engagementUserListResolver: ResolveFn<UserEngagement[] | null> = (route: ActivatedRouteSnapshot) => {
    const engagementService = inject(EngagementService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return engagementService.getUserEmployeeEngagements(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to list Employee Engagements');
            router.navigate(['']);
            return of(null);
        })
    );
};
