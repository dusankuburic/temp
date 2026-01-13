import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmploymentStatus } from '../../models/employmentStatus';
import { AlertifyService } from '../../services/alertify.service';
import { EmploymentStatusService } from '../../services/employment-status.service';
import { PaginatedResult } from 'src/app/core/models/pagination';

export const employmentStatusListResolver: ResolveFn<PaginatedResult<EmploymentStatus[]> | null> = () => {
    const employmentStatusService = inject(EmploymentStatusService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    employmentStatusService.resetEmploymentStatusParams();
    return employmentStatusService.getPagedEmploymentStatuses().pipe(
        catchError(() => {
            alertify.error('Unable to list Employment statuses');
            router.navigate(['']);
            return of(null);
        })
    );
};
