import { InvitationExpiration, InvitationUsageType } from '@/types';
import { randomBytes } from 'crypto';

/**
 * Generate a secure random invitation code
 */
export function generateInvitationCode(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Calculate expiration timestamp based on duration
 */
export function calculateExpirationDate(duration: InvitationExpiration): Date {
  const now = new Date();
  
  switch (duration) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Check if an invitation is expired
 */
export function isInvitationExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Check if invitation has reached usage limit
 */
export function hasReachedUsageLimit(
  usageType: InvitationUsageType,
  usedCount: number
): boolean {
  if (usageType === 'single') {
    return usedCount >= 1;
  }
  return false; // multi-use invitations have no limit
}

/**
 * Validate invitation status
 */
export function validateInvitation(invitation: {
  expires_at: string;
  usage_type: InvitationUsageType;
  used_count: number;
}): { valid: boolean; reason?: string } {
  if (isInvitationExpired(invitation.expires_at)) {
    return { valid: false, reason: 'expired' };
  }

  if (hasReachedUsageLimit(invitation.usage_type, invitation.used_count)) {
    return { valid: false, reason: 'usage_limit_reached' };
  }

  return { valid: true };
}

/**
 * Format invitation URL
 */
export function formatInvitationUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite/${code}`;
}

/**
 * Get expiration label for display
 */
export function getExpirationLabel(duration: InvitationExpiration): string {
  switch (duration) {
    case '24h':
      return '24 hours';
    case '7d':
      return '7 days';
    case '30d':
      return '30 days';
    default:
      return '24 hours';
  }
}

/**
 * Format time remaining until expiration
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} left`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
  }
}

