export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface AuthResponse {
    token: string;
    user: UserProfile;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}
