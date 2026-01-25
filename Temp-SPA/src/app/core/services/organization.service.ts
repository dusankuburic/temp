import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { InnerGroup } from '../models/group';
import { Organization, OrganizationParams } from '../models/organization';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../models/pagination';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  baseUrl = environment.apiUrl;
  organizationParams = new OrganizationParams();

  constructor(private http: HttpClient) { }

  setOrganizationParams(params: OrganizationParams) {
    this.organizationParams = params;
  }

  getOrganizationParams(): OrganizationParams {
    return this.organizationParams;
  }

  resetOrganizationParams(): void {
    this.organizationParams.pageNumber = 1;
    this.organizationParams.pageSize = 10;
    this.organizationParams.name = '';
    this.organizationParams.withGroups = 'all';
  }

  getPagedOrganizations(): Observable<PaginatedResult<Organization[]>> {
    const paginatedResult: PaginatedResult<Organization[]> = new PaginatedResult<Organization[]>();

    let params = new HttpParams();

    params = params.append('pageNumber', this.organizationParams.pageNumber);
    params = params.append('pageSize', this.organizationParams.pageSize);

    params = params.append('withGroups', this.organizationParams.withGroups);

    if (this.organizationParams.name) {
      params = params.append('name', this.organizationParams.name);
    }

    return this.http.get<Organization[]>(this.baseUrl + 'organizations/paged-organizations', {observe: 'response', params})
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

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.baseUrl + 'organizations');
  }

  getOrganizationsForSelect(): Observable<SelectionOption<number>[]> {
    return this.http.get<Organization[]>(this.baseUrl + 'organizations')
      .pipe(map(x => x.map(p => ({
        value: p.id,
        display: p.name,
      } as SelectionOption<number>)))
    );
  }

  checkOrganizationExists(name: string): Observable<boolean> {
    return this.http.get<boolean>(this.baseUrl + 'organizations/organization-exists?name=' + name);
  }

  getOrganization(id: number): Observable<Organization> {
    return this.http.get<Organization>(this.baseUrl + 'organizations/' + id);
  }

  updateOrganization(organization: Organization): Observable<void> {
    return this.http.put<void>(this.baseUrl + 'organizations/' + organization.id, organization);
  }

  createOrganization(organization: Organization): Observable<Organization> {
    return this.http.post<Organization>(this.baseUrl + 'organizations', organization);
  }

  getInnerGroups(organizationId: number): Observable<InnerGroup[]> {
    return this.http.get<InnerGroup[]>(this.baseUrl + 'organizations/inner-groups/' + organizationId);
  }

  getInnerGroupsForSelect(organizationId: number): Observable<SelectionOption<number>[]> {
    return this.http.get<InnerGroup[]>(this.baseUrl + 'organizations/inner-groups/' + organizationId)
      .pipe(map(x => x.map(p => ({
        value: p.id,
        display: p.name,
      } as SelectionOption<number>)))
    );
  }

  changeStatus(id: number): Observable<void> {
    return this.http.put<void>(this.baseUrl + 'organizations/change-status/' + id, {id});
  }

}
