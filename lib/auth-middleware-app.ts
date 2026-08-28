import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_TOKEN_COOKIE } from './auth-cookie';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthResult {
  user: JWTPayload;
}

/**
 * Extract and verify JWT token from NextRequest.
 * Returns the decoded user payload or null.
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.substring(7));
  }

  const cookieToken = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  return cookieToken ? verifyToken(cookieToken) : null;
}

/**
 * Require authentication for an App Router route handler.
 * Pass the request and get back the authenticated user, or receive a 401 response.
 */
export function requireAuth(request: NextRequest): AuthResult | NextResponse {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, message: '未提供认证令牌或令牌无效' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Require specific roles for an App Router route handler.
 */
export function requireRoles(request: NextRequest, allowedRoles: string[]): AuthResult | NextResponse {
  const result = requireAuth(request);

  if (result instanceof NextResponse) {
    return result;
  }

  if (!allowedRoles.includes(result.user.role)) {
    return NextResponse.json(
      { success: false, message: '权限不足' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Helper to check if requireAuth/requireRoles returned an error response.
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Require Agent API key authentication (for Cursor Agent / MCP publishing).
 * Accepts Authorization: Bearer <key> or X-Agent-Key header.
 */
export function requireAgentAuth(request: NextRequest): true | NextResponse {
  const agentKey = process.env.AGENT_API_KEY;
  if (!agentKey) {
    return NextResponse.json(
      { success: false, message: 'Agent API 未配置，请设置 AGENT_API_KEY 环境变量' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const headerKey = request.headers.get('x-agent-key');

  let providedKey: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    providedKey = authHeader.substring(7);
  } else if (headerKey) {
    providedKey = headerKey;
  }

  if (!providedKey || providedKey !== agentKey) {
    return NextResponse.json(
      { success: false, message: 'Agent API Key 无效' },
      { status: 401 }
    );
  }

  return true;
}

/**
 * Gitee 签名密钥模式：X-Gitee-Token + X-Gitee-Timestamp
 * @see https://help.gitee.com/webhook/gitee-webhook-push-data-format
 */
function verifyGiteeSignature(secret: string, timestamp: string, token: string): boolean {
  try {
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    if (Math.abs(Date.now() - ts) > 3600 * 1000) return false;

    const payload = `${timestamp}\n${secret}`;
    const sign = createHmac('sha256', secret).update(payload).digest('base64');
    return token === sign;
  } catch {
    return false;
  }
}

/**
 * Require deploy webhook secret.
 * Supports: Bearer / X-Deploy-Secret, Gitee 密码 (X-Gitee-Token 或 body.password), Gitee 签名密钥.
 */
export function requireDeployAuth(
  request: NextRequest,
  body?: Record<string, unknown>
): true | NextResponse {
  const deploySecret = process.env.DEPLOY_SECRET;
  if (!deploySecret) {
    return NextResponse.json(
      { success: false, message: '部署 webhook 未配置，请设置 DEPLOY_SECRET' },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-deploy-secret');
  const giteeToken = request.headers.get('x-gitee-token');
  const giteeTimestamp = request.headers.get('x-gitee-timestamp');
  const bodyPassword = typeof body?.password === 'string' ? body.password : null;

  let authorized = false;

  if (authHeader?.startsWith('Bearer ') && authHeader.substring(7) === deploySecret) {
    authorized = true;
  } else if (headerSecret === deploySecret) {
    authorized = true;
  } else if (giteeToken === deploySecret || bodyPassword === deploySecret) {
    // Gitee「密码」模式：明文密码在 X-Gitee-Token 或 JSON body.password
    authorized = true;
  } else if (
    giteeToken &&
    giteeTimestamp &&
    verifyGiteeSignature(deploySecret, giteeTimestamp, giteeToken)
  ) {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json(
      { success: false, message: '部署密钥无效' },
      { status: 401 }
    );
  }

  return true;
}
