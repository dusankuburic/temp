import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Workplace } from '../../models/workplace';
import { AlertifyService } from '../../services/alertify.service';
import { WorkplaceService } from '../../services/workplace.service';
import { PaginatedResult } from 'src/app/core/models/pagination';

export const workplaceListResolver: ResolveFn<PaginatedResult<Workplace[]> | null> = () => {
    const workplaceService = inject(WorkplaceService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    workplaceService.resetWorkplaceParams();
    return workplaceService.getPagedWorkplaces().pipe(
        catchError(() => {
            alertify.error('Unable to list Workplaces');
            router.navigate(['']);
            return of(null);
        })
    );
};
