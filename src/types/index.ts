export interface Person {
    id: string;
    name: string;
    dateOfBirth: string; // ISO date string
    placeOfBirth?: string; // optional
    parentIds: string[]; // 0, 1, or 2 parent IDs
}

export interface FamilyData {
    persons: Person[];
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: ValidationError[];
}
