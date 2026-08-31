'use client';

import { toast } from './Toast';

export interface ApiEnvelope<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

const LOGIN_PATH = '/admin/login';

let redirecting = false;

export function clearAdminCredentials() {
  if (typeof window === 'undefined') return;
  // Remove credentials written by older builds. Current authentication is cookie-only.
  window.localStorage.removeItem('adminToken');
  window.localStorage.removeItem('adminUser');
  void fetch('/api/auth/logout', { method: 'POST' });
}

export function handleUnauthorized(message = '登录已过期，请重新登录') {
  clearAdminCredentials();
  if (typeof window === 'undefined' || redirecting) return;
  redirecting = true;
  toast.error(message);
  window.setTimeout(() => {
    window.location.href = LOGIN_PATH;
  }, 800);
}

export function buildAuthHeaders(init: RequestInit = {}): Headers {
  const headers = new Headers(init.headers);
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, { ...init, headers: buildAuthHeaders(init) });
  if (response.status === 401) handleUnauthorized();
  return response;
}

export async function authJson<T = any>(
  url: string,
  init: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  try {
    const response = await authFetch(url, init);

    let body: ApiEnvelope<T> | null = null;
    try {
      body = (await response.json()) as ApiEnvelope<T>;
    } catch {
      body = null;
    }

    if (!body) {
      return {
        success: false,
        message: response.ok ? '响应解析失败' : `请求失败（${response.status}）`,
      };
    }

    if (!response.ok && body.success !== false) {
      return { ...body, success: false };
    }

    return body;
  } catch (error) {
    console.error('authJson error:', url, error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

interface UploadResult {
  url: string;
}

export function authUpload(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 401) {
        handleUnauthorized();
        reject(new Error('登录已过期，请重新登录'));
        return;
      }

      let body: ApiEnvelope<UploadResult> | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.success && body.data?.url) {
        resolve({ url: body.data.url });
      } else {
        reject(new Error(body?.message || '上传失败'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误')));

    xhr.open('POST', url);
    xhr.send(formData);
  });
}
