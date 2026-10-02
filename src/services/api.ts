import {
  User,
  DonorProfile,
  Hospital,
  BloodBank,
  InventoryItem,
  EmergencyRequest,
  CandidateMatch,
  RequestEvent,
  DonorNotification,
  RelayMessage,
  PincodeRecord,
  SystemMetrics,
  AuditLogEntry,
  CompatibilityRule
} from '../types';

const BASE_URL = '/api';

// In-memory & localStorage session state
let sessionToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('ban_session_token') : null;
let sessionUser: User | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

try {
  const cached = typeof window !== 'undefined' ? localStorage.getItem('ban_session_user') : null;
  if (cached) {
    sessionUser = JSON.parse(cached);
  }
} catch (e) {
  // ignore
}

export function setSessionAuth(token: string | null, user: User | null) {
  sessionToken = token;
  sessionUser = user;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('ban_session_token', token);
    else localStorage.removeItem('ban_session_token');

    if (user) localStorage.setItem('ban_session_user', JSON.stringify(user));
    else localStorage.removeItem('ban_session_user');
  }
}

export function getStoredSessionToken(): string | null {
  return sessionToken;
}

export function getStoredUser(): User | null {
  return sessionUser;
}

export function setSessionExpiredListener(callback: () => void) {
  onSessionExpiredCallback = callback;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(sessionToken ? {
      'Authorization': `Bearer ${sessionToken}`,
      'x-session-token': sessionToken
    } : {}),
    ...(sessionUser ? {
      'x-user-id': sessionUser.id
    } : {}),
    ...((options?.headers as Record<string, string>) || {})
  };

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // If authenticated request was rejected due to expiry
    if (sessionToken && !url.includes('/auth/login') && !url.includes('/auth/request-otp') && !url.includes('/auth/verify-otp')) {
      setSessionAuth(null, null);
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
    }
  }

  if (!res.ok) {
    let errMessage = 'Request failed';
    try {
      const err = await res.json();
      errMessage = err.error || err.message || errMessage;
    } catch (e) {
      errMessage = `HTTP error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: () => fetchJson<{ status: string; redis: string; openRequests: number; degradedWarning: string | null }>('/health'),

  // Auth & Identity
  login: async (email?: string, role?: string) => {
    const res = await fetchJson<{ token: string; expiresAt: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
    setSessionAuth(res.token, res.user);
    return res;
  },

  logout: async () => {
    try {
      await fetchJson<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST'
      });
    } catch (e) {
      // ignore
    } finally {
      setSessionAuth(null, null);
    }
  },

  requestOtp: (emailOrPhone: string, isDemoMode = true) =>
    fetchJson<{
      success: boolean;
      message: string;
      expiresInSeconds: number;
      simulatedDevOtp?: string;
      isSimulatedDemo: boolean;
      disclaimer: string;
      cooldownSeconds?: number;
    }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, isDemoMode })
    }),

  verifyOtp: (emailOrPhone: string, otp: string) =>
    fetchJson<{ success: boolean; message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, otp })
    }),

  register: async (payload: any) => {
    const res = await fetchJson<{
      message: string;
      token: string;
      expiresAt: string;
      user: User;
      otpIssued: boolean;
      simulatedDevOtp?: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setSessionAuth(res.token, res.user);
    return res;
  },

  getSession: () => fetchJson<{ authenticated: boolean; user: User; donor: DonorProfile | null }>('/auth/session'),

  getMe: () => fetchJson<{ user: User; donor: DonorProfile | null }>('/users/me'),

  // Donor Specific Controls (Scoped to current donor session)
  toggleAvailability: (candidateCode: string, isAvailable: boolean) =>
    fetchJson<{ success: boolean; donor: DonorProfile }>('/donors/me/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable })
    }),

  updateDonorAlertsConsent: (emergencyAlertsOptIn: boolean) =>
    fetchJson<{ success: boolean; donor: DonorProfile }>('/donors/me/alerts-consent', {
      method: 'PATCH',
      body: JSON.stringify({ emergencyAlertsOptIn })
    }),

  updateDonorHealth: (healthData: {
    weightKg?: number;
    recentIllness?: boolean;
    recentMedication?: boolean;
    recentTravel?: boolean;
    selfReportedFit?: boolean;
    notes?: string;
  }) =>
    fetchJson<{ success: boolean; donor: DonorProfile; disclaimer: string }>('/donors/me/health', {
      method: 'PATCH',
      body: JSON.stringify(healthData)
    }),

  redeemRewardOffer: (offerId: string) =>
    fetchJson<{ success: boolean; voucherCode?: string; message?: string }>('/donors/me/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ offerId })
    }),

  // Location / Geocoding
  lookupPincode: (pincode: string) => fetchJson<PincodeRecord>(`/location/pincode/${pincode}`),

  getNearbyHospitals: (pincode?: string) =>
    fetchJson<Array<Hospital & { distanceKm: number }>>(`/locations/nearby-hospitals?pincode=${pincode || '680001'}`),

  getNearbyBanks: (pincode?: string) =>
    fetchJson<Array<BloodBank & { distanceKm: number; inventorySummary: string }>>(
      `/locations/nearby-banks?pincode=${pincode || '680001'}`
    ),

  getDonorZones: () =>
    fetchJson<Array<{ pincode: string; district: string; state: string; lat: number; lng: number; donorCount: number; availableCount: number }>>(
      '/locations/donor-zones'
    ),

  // Inventory (Blood Bank isolated)
  getInventory: (bankId?: string) =>
    fetchJson<InventoryItem[]>(`/blood-banks/inventory${bankId ? `?bankId=${bankId}` : ''}`),

  addInventoryItem: (payload: Partial<InventoryItem>) =>
    fetchJson<InventoryItem>('/blood-banks/inventory', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) =>
    fetchJson<InventoryItem>(`/blood-banks/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  deleteInventoryItem: (id: string) =>
    fetchJson<{ success: boolean }>(`/blood-banks/inventory/${id}`, {
      method: 'DELETE'
    }),

  importInventoryCsv: (csvText: string, bloodBankId?: string) =>
    fetchJson<{ success: boolean; totalRows: number; unitsImported: number; errors: any[] }>(
      '/blood-banks/inventory/import',
      {
        method: 'POST',
        body: JSON.stringify({ csvText, bloodBankId })
      }
    ),

  // Emergency Requests
  getRequests: () => fetchJson<EmergencyRequest[]>('/requests'),

  getRequestById: (id: string) =>
    fetchJson<{ request: EmergencyRequest; candidates: CandidateMatch[]; events: RequestEvent[] }>(`/requests/${id}`),

  createEmergencyRequest: (payload: any) =>
    fetchJson<{ request: EmergencyRequest; matching: any }>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  confirmRequest: (id: string) =>
    fetchJson<{ success: boolean; request: EmergencyRequest; matching: any }>(`/requests/${id}/confirm`, {
      method: 'POST'
    }),

  triggerMatching: (requestId: string) =>
    fetchJson<any>(`/matching/${requestId}`, {
      method: 'POST'
    }),

  // Notifications
  getNotifications: (candidateCode?: string) =>
    fetchJson<DonorNotification[]>(`/notifications${candidateCode ? `?candidateCode=${candidateCode}` : ''}`),

  acceptSos: (notificationId: string, candidateCode?: string) =>
    fetchJson<{ status: string; message: string; matchDetails: any }>(`/notifications/${notificationId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ candidateCode })
    }),

  declineSos: (notificationId: string, candidateCode?: string) =>
    fetchJson<{ success: boolean; message: string }>(`/notifications/${notificationId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ candidateCode })
    }),

  // Relay Messaging
  getRelayMessages: (requestId: string) =>
    fetchJson<{ messages: RelayMessage[]; structuredPresets: string[]; directContactEnabled: boolean }>(
      `/relay/${requestId}/messages`
    ),

  sendRelayMessage: (payload: {
    requestId: string;
    senderRole: string;
    senderCandidateId?: string;
    message: string;
    isStructured?: boolean;
  }) =>
    fetchJson<RelayMessage>(`/relay/${payload.requestId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // NSS
  getNssStats: () => fetchJson<any>('/nss/stats'),
  createNssCamp: (payload: any) =>
    fetchJson<any>('/nss/camps', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  importNssDonors: (csvText: string) =>
    fetchJson<any>('/nss/donors/import', {
      method: 'POST',
      body: JSON.stringify({ csvText })
    }),

  // Admin
  getAdminUsers: () => fetchJson<any[]>('/admin/users'),
  unmaskUserPii: (userId: string, reason: string) =>
    fetchJson<{ user: any; unmasked: boolean; auditNotice: string }>(`/admin/users/${userId}/unmask`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  verifyUser: (userId: string, status: string) =>
    fetchJson<User>(`/admin/users/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  getAnalytics: () => fetchJson<SystemMetrics>('/admin/analytics'),
  getAuditLogs: () => fetchJson<AuditLogEntry[]>('/admin/audit-logs'),
  getAdminSettings: () => fetchJson<any>('/admin/settings'),
  updateAdminSettings: (settings: any) =>
    fetchJson<any>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    }),
  getCompatibilityRules: () => fetchJson<CompatibilityRule[]>('/admin/compatibility-rules'),

  // Demo Scenarios
  runThrissurDemo: () => fetchJson<any>('/admin/demo/thrissur', { method: 'POST' }),
  fastForwardTimeout: () => fetchJson<any>('/admin/demo/fast-forward', { method: 'POST' }),
  resetDemo: () => fetchJson<any>('/admin/demo/reset', { method: 'POST' })
};
