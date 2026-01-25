import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmploymentStatus } from '../../models/employmentStatus';
import { AlertifyService } from '../../services/alertify.service';
import { EmploymentStatusService } from '../../services/employment-status.service';

export const employmentStatusEditResolver: ResolveFn<EmploymentStatus | null> = (route: ActivatedRouteSnapshot) => {
    const employmentStatusService = inject(EmploymentStatusService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return employmentStatusService.getEmploymentStatus(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Employment status');
            router.navigate(['/employment-statuses']);
            return of(null);
        })
    );
};
