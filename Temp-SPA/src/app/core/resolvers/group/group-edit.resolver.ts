import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Group } from '../../models/group';
import { AlertifyService } from '../../services/alertify.service';
import { GroupService } from '../../services/group.service';

export const groupEditResolver: ResolveFn<Group | null> = (route: ActivatedRouteSnapshot) => {
    const groupService = inject(GroupService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return groupService.getGroup(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Group');
            router.navigate(['/organizations']);
            return of(null);
        })
    );
};
