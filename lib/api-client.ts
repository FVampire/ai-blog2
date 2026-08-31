// API Client for making authenticated requests

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface LoginData {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    _requiresAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Request failed',
        };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth APIs
  async login(username: string, password: string): Promise<ApiResponse<LoginData>> {
    return this.request<LoginData>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me', {}, true);
  }

  // Posts APIs
  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    return this.request(
      `/api/posts${queryString ? `?${queryString}` : ''}`,
      {},
      false
    );
  }

  async getPost(id: number) {
    return this.request(`/api/posts/${id}`, {}, true);
  }

  async updatePost(id: number, data: any) {
    return this.request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deletePost(id: number) {
    return this.request(`/api/posts/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Users APIs
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const queryString = searchParams.toString();
    return this.request(
      `/api/users${queryString ? `?${queryString}` : ''}`,
      {},
      true
    );
  }

  async getUser(id: number) {
    return this.request(`/api/users/${id}`, {}, true);
  }

  async updateUser(id: number, data: any) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteUser(id: number) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Generic GET method
  async get<T = any>(endpoint: string, requiresAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {}, requiresAuth);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
