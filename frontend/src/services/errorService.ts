export interface NormalizedApiError {
  title: string;
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
  isNetworkError: boolean;
  isAuthError: boolean;
  isPermissionError: boolean;
  isNotFound: boolean;
  isRateLimited: boolean;
  raw?: any;
}

export function normalizeApiError(error: any): NormalizedApiError {
  // Default values
  let title = 'Operation Failed';
  let message = 'An unexpected error occurred. Please try again.';
  const fieldErrors: Record<string, string> = {};
  let status: number | undefined;
  let isNetworkError = false;
  let isAuthError = false;
  let isPermissionError = false;
  let isNotFound = false;
  let isRateLimited = false;

  // Handle standard TypeError / Network offline
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return {
      title: 'Connection Lost',
      message: 'Unable to reach the school server. Please check your internet connection.',
      fieldErrors: {},
      isNetworkError: true,
      isAuthError: false,
      isPermissionError: false,
      isNotFound: false,
      isRateLimited: false,
      raw: error,
    };
  }

  // If error has status code
  if (error?.status) {
    status = Number(error.status);
    if (status === 401) {
      isAuthError = true;
      title = 'Session Expired';
      message = 'Your session has expired. Please sign in again.';
    } else if (status === 403) {
      isPermissionError = true;
      title = 'Access Restricted';
      message = 'You do not have administrative permission to perform this action.';
    } else if (status === 404) {
      isNotFound = true;
      title = 'Record Not Found';
      message = 'The requested school record could not be found. It may have been removed.';
    } else if (status === 409) {
      title = 'Conflict Detected';
      message = 'This record or identifier already exists in the system.';
    } else if (status === 429) {
      isRateLimited = true;
      title = 'Too Many Requests';
      message = 'System is experiencing high traffic. Please wait a moment before trying again.';
    } else if (status >= 500) {
      title = 'Server Error';
      message = 'The server encountered an unexpected error while processing your request. Please try again.';
    }
  }

  // Parse Django REST Framework error structures
  const errorData = error?.errors || error?.response?.data || error;

  if (typeof errorData === 'string') {
    message = errorData;
  } else if (errorData && typeof errorData === 'object') {
    // 1. Check for single string fields like 'detail', 'error', 'message'
    if (typeof errorData.detail === 'string') {
      message = errorData.detail;
    } else if (typeof errorData.error === 'string') {
      message = errorData.error;
    } else if (typeof errorData.message === 'string') {
      message = errorData.message;
    } else if (Array.isArray(errorData.non_field_errors)) {
      message = errorData.non_field_errors.join(' ');
    } else if (Array.isArray(errorData.detail)) {
      message = errorData.detail.join(' ');
    } else {
      // 2. Parse dictionary of field errors: { username: ["This field is required."], email: ["Invalid email."] }
      const extractedMessages: string[] = [];
      Object.entries(errorData).forEach(([field, value]) => {
        if (field === 'status' || field === 'status_code') return;

        let fieldMsg = '';
        if (Array.isArray(value)) {
          fieldMsg = value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
        } else if (typeof value === 'string') {
          fieldMsg = value;
        } else if (value && typeof value === 'object') {
          fieldMsg = JSON.stringify(value);
        }

        if (fieldMsg) {
          fieldErrors[field] = fieldMsg;
          const formattedFieldName = field
            .replace(/_/g, ' ')
            .replace(/^\w/, (c) => c.toUpperCase());
          extractedMessages.push(`${formattedFieldName}: ${fieldMsg}`);
        }
      });

      if (extractedMessages.length > 0) {
        title = 'Validation Required';
        message = extractedMessages.join(' • ');
      }
    }
  } else if (error?.message) {
    message = error.message;
  }

  return {
    title,
    message,
    fieldErrors,
    status,
    isNetworkError,
    isAuthError,
    isPermissionError,
    isNotFound,
    isRateLimited,
    raw: error,
  };
}
