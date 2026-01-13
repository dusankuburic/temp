import { PaginatedResult } from "./pagination";

export interface Team {
    id: number;
    name: string;
    groupId: number;
}

export interface InnerTeams {
    id: number;
    name: string;
    teams: Team[];
}

export interface InnerTeam {
    id: number;
    name: string;
}

export interface PagedInnerTeams {
    id: number;
    name: string;
    teams: PaginatedResult<Team[]>;
}

export interface FullTeam {
    teamId: number;
    teamName: string;
    organizationId: number;
    organizationName: string;
    groupId: number;
    groupName: string;
}

export class TeamParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    name: string = '';
}
