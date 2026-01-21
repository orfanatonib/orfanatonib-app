import { AuthErrorStatus } from '@/constants/errors/auth';
export interface ForgotPasswordResponse {
    status: AuthErrorStatus;
    message: string;
    verificationEmailSent?: boolean;
}

export interface ValidateTokenResponse {
    valid: boolean;
    email?: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface AuthErrorResponse {
    statusCode: number;
    message: string | {
        status: string;
        message: string;
    };
}
