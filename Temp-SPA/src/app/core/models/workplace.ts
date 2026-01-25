
export interface Workplace {
    id: number;
    name: string;
    profilePictureUrl?: string;
}

export interface UpdateWorkplaceStatus {
    id: number;
}

export class WorkplaceParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    name: string = '';
}
