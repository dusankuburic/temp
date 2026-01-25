export interface Engagement {
    id: number;
    employeeId: number;
    workplaceId: number;
    employmentStatusId: number;
    dateFrom: Date;
    dateTo: Date;
}

export interface UserEngagement {
    workplaceName: string;
    employmentStatusName: string;
    dateFrom: Date;
    dateTo: Date;
    salary: number;
}

export interface ExistingEngagement {
    id: number;
    workplaceName: string;
    employmentStatusName: string;
    salary: number;
    dateFrom: Date;
    dateTo: Date;
}

export class EngagementParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    firstName: string = '';
    lastName: string = '';
    role: string = '';
}
