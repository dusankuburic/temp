import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AssignRoleDto } from '../models/assignRoleDto';
import { Employee, EmployeeParams } from '../models/employee';
import { PaginatedResult } from '../models/pagination';
import { UnassignRoleDto } from '../models/unassignRoleDto';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  baseUrl = environment.apiUrl;
  employeeParams = new EmployeeParams();

constructor(private http: HttpClient) { }

setEmployeeParams(params: EmployeeParams): void {
  this.employeeParams = params;
}

getEmployeeParams(): EmployeeParams {
  return this.employeeParams;
}

resetEmployeeParams(): void {
  this.employeeParams.pageNumber = 1;
  this.employeeParams.pageSize = 10;
  this.employeeParams.firstName = '';
  this.employeeParams.lastName = '';
  this.employeeParams.role = '';
}

getEmployees(): Observable<PaginatedResult<Employee[]>> {
  const paginatedResult: PaginatedResult<Employee[]> = new PaginatedResult<Employee[]>();

  let params = new HttpParams();

  params = params.append('pageNumber', this.employeeParams.pageNumber);
  params = params.append('pageSize', this.employeeParams.pageSize);

  if (this.employeeParams.role) {
    params = params.append('role', this.employeeParams.role);
  }
  if (this.employeeParams.firstName) {
    params = params.append('firstName', this.employeeParams.firstName);
  }
  if (this.employeeParams.lastName) {
    params = params.append('lastName', this.employeeParams.lastName);
  }

  return this.http.get<Employee[]>(this.baseUrl + 'employees', {observe : 'response', params})
    .pipe(
      map(response => {
        paginatedResult.result = response.body ?? [];
        if (response.headers.get('Pagination') != null) {
          paginatedResult.pagination = JSON.parse(response.headers.get('Pagination') ?? '{}');
        }
        return paginatedResult;
      })
    );
}

getModerator(employeeId: number): Observable<any> {
  return this.http.get<any>(this.baseUrl + 'moderators/' + employeeId);
}

getEmployee(id: number): Observable<Employee> {
  return this.http.get<Employee>(this.baseUrl + 'employees/' + id);
}

createEmployee(employee: Employee): Observable<Employee> {
  return this.http.post<Employee>(this.baseUrl + 'employees', employee);
}

updateEmployee(employee: Employee): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'employees/' + employee.id, employee);
}

assignRole(entity: AssignRoleDto): any {
  return this.http.post(this.baseUrl + 'accounts/register', entity);
}

unassignRole(entity: UnassignRoleDto): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'accounts/unassign/' + entity.id, entity);
}

changeStatus(id: number): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'accounts/change-status/' + id, id);
}

checkEmailExists(uname: string): Observable<boolean> {
  return this.http.get<boolean>(this.baseUrl + 'accounts/username-exists?username=' + uname);
}

getEmployeeUsername(employeeId: number): Observable<string> {
  return this.http.get<string>(this.baseUrl + 'accounts/employee-username/' + employeeId);
}

}
