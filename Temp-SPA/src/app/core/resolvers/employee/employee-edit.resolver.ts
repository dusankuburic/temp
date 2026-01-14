import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Employee } from '../../models/employee';
import { AlertifyService } from '../../services/alertify.service';
import { EmployeeService } from '../../services/employee.service';

export const employeeEditResolver: ResolveFn<Employee | null> = (route: ActivatedRouteSnapshot) => {
    const employeeService = inject(EmployeeService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    return employeeService.getEmployee(route.params['id']).pipe(
        catchError(() => {
            alertify.error('Unable to get Employee');
            router.navigate(['/employees']);
            return of(null);
        })
    );
};
