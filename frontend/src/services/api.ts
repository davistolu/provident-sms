import { PaginatedResponse } from '@/types';

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

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, body?: any): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(url: string, body?: any): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const response = await fetch(finalUrl, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const response = await fetch(finalUrl, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('active_school_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    if (schoolId) headers['X-School-ID'] = schoolId;

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  async downloadFile(url: string, filename?: string): Promise<void> {
    const finalUrl = url.startsWith('/api') ? url : `${API_BASE}${url}`;
    const token = localStorage.getItem('auth_token');
    const schoolId = localStorage.getItem('active_school_id');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    if (schoolId) headers['X-School-ID'] = schoolId;

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errMsg = 'Failed to download file.';
      try {
        const json = await response.json();
        errMsg = json.detail || json.error || json.message || errMsg;
      } catch {}
      throw new Error(errMsg);
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
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Unauthenticated session
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText || 'An unexpected error occurred.' };
      }
      const message = errorData.message || (errorData.detail ? String(errorData.detail) : 'Request failed.');
      const err = new Error(message) as any;
      err.status = response.status;
      err.errors = errorData.errors || errorData;
      throw err;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const api = new ApiClient();
