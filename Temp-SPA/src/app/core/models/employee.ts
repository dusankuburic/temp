
export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    role: string;
    teamId: number;
    isAppUserActive: boolean;
}

export class EmployeeParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    role: string = '';
    firstName: string = '';
    lastName: string = '';
}
