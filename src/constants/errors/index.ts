/**
 * Error Constants - Central Export
 * 
 * Re-exports all error constants and enums for easy importing
 */

// Authentication errors
export {
    AuthErrorStatus,
    AUTH_ERROR_MESSAGES,
    AUTH_SUCCESS_MESSAGES,
    AUTH_VALIDATION,
} from './auth';

// Contact errors
export {
    CONTACT_ERROR_MESSAGES,
    CONTACT_SUCCESS_MESSAGES,
} from './contact';

// Login errors
export {
    LOGIN_ERROR_MESSAGES,
    LOGIN_SUCCESS_MESSAGES,
    LOGIN_VALIDATION,
} from './login';

// Registration errors
export {
    REGISTER_ERROR_MESSAGES,
    REGISTER_SUCCESS_MESSAGES,
    REGISTER_VALIDATION_MESSAGES,
    REGISTER_VALIDATION,
} from './register';

// Profile errors
export {
    PROFILE_ERROR_MESSAGES,
    PROFILE_SUCCESS_MESSAGES,
} from './profile';

// Event errors
export {
    EVENT_ERROR_MESSAGES,
    EVENT_SUCCESS_MESSAGES,
} from './event';

// Attendance errors
export {
    ATTENDANCE_ERROR_MESSAGES,
    ATTENDANCE_SUCCESS_MESSAGES,
} from './attendance';

// Common/API errors
export {
    COMMON_ERROR_MESSAGES,
    API_ERROR_MESSAGES,
    HTTP_STATUS_MESSAGES,
} from './common';
