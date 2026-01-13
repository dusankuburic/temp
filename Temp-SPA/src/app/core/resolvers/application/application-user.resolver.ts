import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Application } from 'src/app/core/models/application';
import { AlertifyService } from 'src/app/core/services/alertify.service';
import { ApplicationService } from 'src/app/core/services/application.service';

export const applicationUserResolver: ResolveFn<Application | null> = (route: ActivatedRouteSnapshot) => {
    const applicationService = inject(ApplicationService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return applicationService.getApplication(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Application');
            router.navigate(['']);
            return of(null);
        })
    );
};
