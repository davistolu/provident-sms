import { PaginatedResponse } from '@/types';
import { normalizeApiError } from '@/services/errorService';

const API_BASE = '/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('active_school_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    if (schoolId) {
      headers['X-School-ID'] = schoolId;
    }
    return headers;
  }

  private async executeFetch<T>(fetcher: () => Promise<Response>): Promise<T> {
    try {
      const response = await fetcher();
      return await this.handleResponse<T>(response);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      const enhancedError = new Error(normalized.message) as any;
      enhancedError.title = normalized.title;
      enhancedError.status = normalized.status || err?.status;
      enhancedError.fieldErrors = normalized.fieldErrors;
      enhancedError.isNetworkError = normalized.isNetworkError;
      enhancedError.isAuthError = normalized.isAuthError;
      enhancedError.isPermissionError = normalized.isPermissionError;
      enhancedError.raw = err;
      throw enhancedError;
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    let finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    return this.executeFetch<T>(() =>
      fetch(finalUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      })
    );
  }

  async post<T>(url: string, body?: any): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    return this.executeFetch<T>(() =>
      fetch(finalUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })
    );
  }

  async patch<T>(url: string, body?: any): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    return this.executeFetch<T>(() =>
      fetch(finalUrl, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })
    );
  }

  async delete<T>(url: string): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    return this.executeFetch<T>(() =>
      fetch(finalUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
    );
  }

  async upload<T>(url: string, formData: FormData, method: 'POST' | 'PATCH' = 'POST'): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('active_school_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    if (schoolId) headers['X-School-ID'] = schoolId;

    return this.executeFetch<T>(() =>
      fetch(finalUrl, {
        method,
        headers,
        body: formData,
      })
    );
  }

  async uploadPatch<T>(url: string, formData: FormData): Promise<T> {
    return this.upload<T>(url, formData, 'PATCH');
  }

  async downloadFile(url: string, filename?: string): Promise<void> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('active_school_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    if (schoolId) headers['X-School-ID'] = schoolId;

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText || 'Failed to download file.' };
        }
        const normalized = normalizeApiError({ ...errorData, status: response.status });
        throw new Error(normalized.message);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      if (filename) {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(blobUrl, '_blank');
      }
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
    } catch (err: any) {
      const normalized = normalizeApiError(err);
      throw new Error(normalized.message);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText || 'An unexpected error occurred.' };
      }

      const normalized = normalizeApiError({ ...errorData, status: response.status });
      const err = new Error(normalized.message) as any;
      err.title = normalized.title;
      err.status = response.status;
      err.fieldErrors = normalized.fieldErrors;
      err.errors = errorData;
      err.isNetworkError = normalized.isNetworkError;
      err.isAuthError = normalized.isAuthError;
      err.isPermissionError = normalized.isPermissionError;
      throw err;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const api = new ApiClient();

