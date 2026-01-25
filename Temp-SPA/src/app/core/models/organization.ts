export interface Organization {
    id: number;
    name: string;
    profilePictureUrl?: string;
    hasActiveGroup: boolean;
}

export class OrganizationParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    name: string = '';
    withGroups: string = 'all';
}
