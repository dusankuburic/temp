
export interface EmploymentStatus {
    id: number;
    name: string;
}

export class EmploymentStatusParams {
    pageNumber: number = 1;
    pageSize: number = 10;
    name: string = '';
}
