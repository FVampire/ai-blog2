import { NextRequest } from 'next/server';

import { query } from './db';
import { JWTPayload } from './jwt';

interface AuditEvent {
  request: NextRequest;
  user: JWTPayload;
  action: string;
  resourceType: string;
  resourceId?: string | number;
  metadata?: Record<string, unknown>;
}

/** Audit failures are reported server-side but never roll back an already completed action. */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const forwardedFor = event.request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim()
      || event.request.headers.get('x-real-ip')
      || null;

    await query(
      `INSERT INTO audit_logs
        (actor_id, actor_username, action, resource_type, resource_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [
        event.user.userId,
        event.user.username,
        event.action,
        event.resourceType,
        event.resourceId === undefined ? null : String(event.resourceId),
        JSON.stringify(event.metadata || {}),
        ipAddress,
        event.request.headers.get('user-agent'),
      ],
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
