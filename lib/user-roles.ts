export type UserRole = 'admin' | 'editor' | 'author';
export type UserStatus = 'active' | 'inactive';

export const USER_ROLES: readonly UserRole[] = ['admin', 'editor', 'author'];
export const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive'];
