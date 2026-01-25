import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Group, GroupParams, InnerGroups, PagedInnerGroups } from '../models/group';
import { ModeratorMin } from '../models/moderator';
import { InnerTeam } from '../models/team';
import { Observable, map } from 'rxjs';
import { PaginatedResult } from '../models/pagination';
import { SelectionOption } from 'src/app/shared/components/tmp-select/tmp-select.component';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  baseUrl = environment.apiUrl;
  groupParams = new GroupParams();

constructor(private http: HttpClient) { }

setGroupParams(params: GroupParams) {
  this.groupParams = params;
}

getGroupParams(): GroupParams {
  return this.groupParams;
}

resetGroupParams(): void {
  this.groupParams.pageNumber = 1;
  this.groupParams.pageSize = 10;
  this.groupParams.name = '';
  this.groupParams.withTeams = 'all';
}

getInnerGroups(organizationId: number): Observable<PagedInnerGroups> {
  const paginatedResult: PaginatedResult<Group[]> = new PaginatedResult<Group[]>();

  let params = new HttpParams();

  params = params.append('organizationId', organizationId);
  params = params.append('pageNumber', this.groupParams.pageNumber);
  params = params.append('pageSize', this.groupParams.pageSize);

  params = params.append('withTeams', this.groupParams.withTeams);

  if (this.groupParams.name) {
    params = params.append('name', this.groupParams.name);
  }

  return this.http.get<InnerGroups>(this.baseUrl + 'organizations/paged-inner-groups', {observe: 'response', params})
    .pipe(
      map(response => {
        const body = response.body!;
        paginatedResult.result = body.groups;
        if (response.headers.get('Pagination') != null) {
          paginatedResult.pagination =  JSON.parse(response.headers.get('Pagination') ?? '{}');
        }
        return {
          id: body.id,
          name: body.name,
          groups: paginatedResult
        };
      })
    );
}

getGroups(organizationId: number): Observable<InnerGroups> {
  return this.http.get<InnerGroups>(this.baseUrl + 'organizations/inner-groups/' + organizationId);
}

checkGroupExists(name: string, organizationId: number): Observable<boolean> {
  return this.http.get<boolean>(this.baseUrl + `groups/group-exists?name=${name}&organizationId=${organizationId}`);
}

getGroup(id: number): Observable<Group> {
  return this.http.get<Group>(this.baseUrl + 'groups/' + id);
}

createGroup(group: Group): Observable<Group> {
  return this.http.post<Group>(this.baseUrl + 'groups', group);
}

updateGroup(id: number, group: Group): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'groups/' + id, group);
}

getInnerTeams(groupId: number): Observable<InnerTeam[]> {
  return this.http.get<InnerTeam[]>(this.baseUrl + 'groups/inner-teams/' + groupId);
}

  getInnerTeamsForSelect(groupId: number): Observable<SelectionOption<number>[]> {
    return this.http.get<InnerTeam[]>(this.baseUrl + 'groups/inner-teams/' + groupId)
      .pipe(map(x => x.map(p => ({
        value: p.id,
        display: p.name,
      } as SelectionOption<number>)))
    );
  }

getModeratorGroups(moderatorId: number): Observable<Group[]> {
  return this.http.get<Group[]>(this.baseUrl + 'groups/moderator-groups/' + moderatorId);
}

getModeratorFreeGroups(organizationId: number, moderator: ModeratorMin): Observable<Group[]> {
  return this.http.get<Group[]>(this.baseUrl + 'groups/moderator-free-groups/' + organizationId + '/moderator/' + moderator.id);
}

updateModeratorGroups(id: number, groups: number[]): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'moderators/update-groups/' + id, groups);
}

changeStatus(id: number): Observable<void> {
  return this.http.put<void>(this.baseUrl + 'groups/change-status/' + id, id);
}

}
