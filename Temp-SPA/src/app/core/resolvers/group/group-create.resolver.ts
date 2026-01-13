import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Organization } from '../../models/organization';
import { AlertifyService } from '../../services/alertify.service';
import { OrganizationService } from '../../services/organization.service';

export const groupCreateResolver: ResolveFn<Organization | null> = (route: ActivatedRouteSnapshot) => {
    const organizationService = inject(OrganizationService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return organizationService.getOrganization(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Organization');
            router.navigate(['']);
            return of(null);
        })
    );
};
