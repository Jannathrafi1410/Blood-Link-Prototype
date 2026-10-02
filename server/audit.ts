import { AuditLogEntry, UserRole } from '../src/types';

export class AuditService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    // Seed initial system startup audit record
    this.record({
      userId: 'system-init',
      userRole: 'ADMIN',
      action: 'SYSTEM_BOOT',
      resource: 'SERVER',
      details: 'Blood Availability Network initialized with strict PII masking and PostGIS distance matching.'
    });
  }

  public record(entry: {
    userId: string;
    userRole: UserRole;
    action: string;
    resource: string;
    details: string;
    ipAddress?: string;
    piiUnmaskedReason?: string;
  }): AuditLogEntry {
    const logItem: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.logs.unshift(logItem); // newest first
    if (this.logs.length > 500) {
      this.logs.pop(); // keep recent 500 in memory
    }
    return logItem;
  }

  public getRecent(limit = 100): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }
}

export const auditService = new AuditService();
