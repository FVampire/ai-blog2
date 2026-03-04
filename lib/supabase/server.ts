import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, type NextResponse } from 'next/server';

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 类型定义
export type SupabaseClient = ReturnType<typeof createSupabaseServerClient>;

/**
 * 创建 Supabase 服务器客户端
 *
 * @param request Next.js 请求对象
 * @param response Next.js 响应对象
 * @returns Supabase 客户端实例
 */
export function createServerClient(
  request?: NextRequest,
  response?: NextResponse
) {
  // 检查环境变量
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    );
  }

  // 如果没有提供 request/response，则创建一个基本客户端
  if (!request || !response) {
    // 对于服务器组件或没有请求上下文的情况
    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return null;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 在服务器环境中不需要设置 cookie
        },
        remove(name: string, options: CookieOptions) {
          // 在服务器环境中不需要删除 cookie
        },
      },
    });
  }

  // 检查 request 对象是否有 cookies 方法
  if (typeof request.cookies.get === 'function') {
    // 为 API 路由创建客户端
    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            response?.cookies.set({
              name,
              value,
              ...options,
            });
          } catch (e) {
            // Ignore cookie setting errors in API routes
            console.warn('Failed to set cookie:', e);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            response?.cookies.set({
              name,
              value: '',
              ...options,
            });
          } catch (e) {
            // Ignore cookie setting errors in API routes
            console.warn('Failed to remove cookie:', e);
          }
        },
      },
    });
  } else {
    // 如果 request.cookies 不是期望的格式，回退到基本客户端
    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return null;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 在服务器环境中不需要设置 cookie
        },
        remove(name: string, options: CookieOptions) {
          // 在服务器环境中不需要删除 cookie
        },
      },
    });
  }
}

export default createServerClient;