import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Employee } from '../../models/employee';
import { AlertifyService } from '../../services/alertify.service';
import { EngagementService } from '../../services/engagement.service';
import { PaginatedResult } from 'src/app/core/models/pagination';

export const engagementWithoutEmployeeResolver: ResolveFn<PaginatedResult<Employee[]> | null> = () => {
    const engagementService = inject(EngagementService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    engagementService.resetEngagementParams();
    return engagementService.getEmployeesWithoutEngagement().pipe(
        catchError(() => {
            alertify.error('Unable to list Employees');
            router.navigate(['']);
            return of(null);
        })
    );
};
