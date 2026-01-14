import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertifyService } from '../../services/alertify.service';
import { EngagementService } from '../../services/engagement.service';

export const engagementCreateResolver: ResolveFn<any | null> = (route: ActivatedRouteSnapshot) => {
    const engagementService = inject(EngagementService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return engagementService.getEngagementForEmployee(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Employee engagement');
            router.navigate(['']);
            return of(null);
        })
    );
};
