import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Employee } from '../../models/employee';
import { AlertifyService } from '../../services/alertify.service';
import { EmployeeService } from '../../services/employee.service';
import { PaginatedResult } from 'src/app/core/models/pagination';

export const employeeListResolver: ResolveFn<PaginatedResult<Employee[]> | null> = () => {
    const employeeService = inject(EmployeeService);
    const router = inject(Router);
    const alertify = inject(AlertifyService);

    employeeService.resetEmployeeParams();
    return employeeService.getEmployees().pipe(
        catchError(() => {
            alertify.error('Unable to list Employees');
            router.navigate(['']);
            return of(null);
        })
    );
};
