import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Workplace } from '../../models/workplace';
import { AlertifyService } from '../../services/alertify.service';
import { WorkplaceService } from '../../services/workplace.service';

export const workplaceEditResolver: ResolveFn<Workplace | null> = (route: ActivatedRouteSnapshot) => {
    const workplaceService = inject(WorkplaceService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return workplaceService.getWorkplace(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Workplace');
            router.navigate(['/employees']);
            return of(null);
        })
    );
};
