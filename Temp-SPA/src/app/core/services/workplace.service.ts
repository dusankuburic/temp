import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PaginatedResult } from '../models/pagination';
import { UpdateWorkplaceStatus, Workplace, WorkplaceParams } from '../models/workplace';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';

@Injectable({
  providedIn: 'root'
})
export class WorkplaceService {
  baseUrl = environment.apiUrl;
  workplaceParams = new WorkplaceParams();

constructor(private http: HttpClient) { }

setWorkplaceParams(params: WorkplaceParams) {
  this.workplaceParams = params;
}

getWorkplaceParams(): WorkplaceParams {
  return this.workplaceParams;
}

resetWorkplaceParams(): void {
  this.workplaceParams.pageNumber = 1;
  this.workplaceParams.pageSize = 10;
  this.workplaceParams.name = '';
}

getPagedWorkplaces(): Observable<PaginatedResult<Workplace[]>> {
  const paginatedResult: PaginatedResult<Workplace[]> = new PaginatedResult<Workplace[]>();

  let params = new HttpParams();

  params = params.append('pageNumber', this.workplaceParams.pageNumber);
  params = params.append('pageSize', this.workplaceParams.pageSize);

  if (this.workplaceParams.name) {
    params = params.append('name', this.workplaceParams.name);
  }

  return this.http.get<Workplace[]>(this.baseUrl + 'workplaces/paged-workplaces', {observe: 'response', params})
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

checkWorkplaceExists(name: string): Observable<boolean> {
  return this.http.get<boolean>(this.baseUrl + 'workplaces/workplace-exists?name=' + name);
}

getWorkplaces(): Observable<Workplace[]> {
  return this.http.get<Workplace[]>(this.baseUrl + 'workplaces');
}

getWorkplacesForSelect(): Observable<SelectionOption<number>[]> {
  return this.http.get<Workplace[]>(this.baseUrl + 'workplaces')
    .pipe(map(x => x.map(p => ({
      value: p.id,
      display: p.name
    } as SelectionOption<number>)))
  );
}

getWorkplace(id: number): Observable<Workplace> {
  return this.http.get<Workplace>(this.baseUrl + 'workplaces/' + id);
}

createWorkplace(workplace: Workplace): Observable<Workplace> {
  return this.http.post<Workplace>(this.baseUrl + 'workplaces', workplace);
}

updateWorkplace(workplace: Workplace): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'workplaces/' + workplace.id, workplace);
}

changeStatus(request: UpdateWorkplaceStatus): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'workplaces/change-status/' + request.id, request);  
}




}


