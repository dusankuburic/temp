import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { EmploymentStatus, EmploymentStatusParams } from '../models/employmentStatus';
import { PaginatedResult } from '../models/pagination';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';

@Injectable({
  providedIn: 'root'
})
export class EmploymentStatusService {
  baseUrl = environment.apiUrl;
  employmentStatusParams = new EmploymentStatusParams();

constructor(private http: HttpClient) { }

setEmploymentStatusParams(params: EmploymentStatusParams) {
  this.employmentStatusParams = params;
}

getEmploymentStatusParams(): EmploymentStatusParams {
  return this.employmentStatusParams;
}

resetEmploymentStatusParams(): void {
  this.employmentStatusParams.pageNumber = 1;
  this.employmentStatusParams.pageSize = 10;
  this.employmentStatusParams.name = '';
}

getPagedEmploymentStatuses(): Observable<PaginatedResult<EmploymentStatus[]>> {
  const paginatedResult: PaginatedResult<EmploymentStatus[]> = new PaginatedResult<EmploymentStatus[]>();

  let params = new HttpParams();

  params = params.append('pageNumber', this.employmentStatusParams.pageNumber);
  params = params.append('pageSize', this.employmentStatusParams.pageSize);

  if (this.employmentStatusParams.name) {
    params = params.append('name', this.employmentStatusParams.name);
  }

  return this.http.get<EmploymentStatus[]>(this.baseUrl + 'employmentStatuses/paged-employmentstatuses', {observe: 'response', params})
    .pipe(
      map(response => {
        paginatedResult.result = response.body ?? [];
        if(response.headers.get('Pagination') != null) {
          paginatedResult.pagination = JSON.parse(response.headers.get('Pagination') ?? '{}');
        }
        return paginatedResult;
      })
    );
}

getEmploymentStatuses(): Observable<EmploymentStatus[]> {
  return this.http.get<EmploymentStatus[]>(this.baseUrl + 'employmentStatuses');
}

getEmploymentStatusesForSelect(): Observable<SelectionOption<number>[]> {
  return this.http.get<EmploymentStatus[]>(this.baseUrl + 'employmentStatuses')
    .pipe(map(x => x.map(p => ({
      value: p.id,
      display: p.name
    } as SelectionOption<number>)))
  );
}

checkEmploymentStatusExists(name: string): Observable<boolean> {
  return this.http.get<boolean>(this.baseUrl + 'employmentStatuses/employment-status-exists?name=' + name);
}

getEmploymentStatus(id: number): Observable<EmploymentStatus> {
  return this.http.get<EmploymentStatus>(this.baseUrl + 'employmentStatuses/' + id);
}

createEmploymentStatus(employmentStatus: EmploymentStatus): Observable<EmploymentStatus> {
  return this.http.post<EmploymentStatus>(this.baseUrl + 'employmentStatuses', employmentStatus);
}

updateEmploymentStatus(employmentStatus: EmploymentStatus): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'employmentStatuses/' + employmentStatus.id, employmentStatus);
}

changeStatus(id: number): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'employmentStatuses/change-status/' + id, {id});
}

}
