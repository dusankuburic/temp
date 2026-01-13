import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Organization } from '../../models/organization';
import { AlertifyService } from '../../services/alertify.service';
import { OrganizationService } from '../../services/organization.service';
import { PaginatedResult } from '../../models/pagination';

export const organizationListResolver: ResolveFn<PaginatedResult<Organization[]> | null> = () => {
    const organizationService = inject(OrganizationService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    organizationService.resetOrganizationParams();
    return organizationService.getPagedOrganizations().pipe(
        catchError(() => {
            alertify.error('Unable to list Organizations');
            router.navigate(['']);
            return of(null);
        })
    );
};
