import {
  User,
  DonorProfile,
  BloodBank,
  Hospital,
  InventoryItem,
  EmergencyRequest,
  RequestEvent,
  CandidateMatch,
  DonorNotification,
  RelayMessage,
  SystemMetrics,
  BloodGroup,
  BloodComponent,
  UrgencyLevel
} from '../src/types';
import { COMPATIBILITY_RULES, isBloodCompatible } from './compatibility';
import { calculateDistanceKm, getCoarseDonorLocation, lookupPincode } from './pincodes';
import { auditService } from './audit';
import { sanitizeRelayMessage } from './relay';

export class DatabaseStore {
  public users: Map<string, User> = new Map();
  public donorProfiles: Map<string, DonorProfile> = new Map();
  public bloodBanks: Map<string, BloodBank> = new Map();
  public hospitals: Map<string, Hospital> = new Map();
  public inventory: Map<string, InventoryItem> = new Map();
  public requests: Map<string, EmergencyRequest> = new Map();
  public requestEvents: Map<string, RequestEvent[]> = new Map();
  public matches: Map<string, CandidateMatch[]> = new Map(); // key = requestId
  public notifications: Map<string, DonorNotification[]> = new Map(); // key = donorCandidateCode or userId
  public relayMessages: Map<string, RelayMessage[]> = new Map(); // key = requestId
  public nssCamps: Array<{
    id: string;
    unitName: string;
    venue: string;
    date: string;
    pincode: string;
    targetUnits: number;
    collectedUnits: number;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  }> = [];

  public settings = {
    firstWaveRadiusKm: 5,
    secondWaveRadiusKm: 10,
    thirdWaveRadiusKm: 25,
    notificationTimeoutSeconds: 180,
    maxWaveCandidates: 3,
    wholeBloodCooldownDays: 90,
    enableDirectContact: false, // Strictly false per section 5
    redisConnected: true,
    matchingAccuracyTarget: 96.5
  };

  constructor() {
    this.seedAll();
  }

  // Generate public candidate view (Physical exclusion of PII per Section 27)
  public getCandidatePublicView(requestId: string): CandidateMatch[] {
    const candidateList = this.matches.get(requestId) || [];
    return candidateList.map(c => ({
      candidateId: c.candidateId, // e.g. D-014
      requestId: c.requestId,
      bloodGroup: c.bloodGroup,
      approxDistanceKm: c.approxDistanceKm,
      matchScore: c.matchScore,
      scores: { ...c.scores },
      notificationStatus: c.notificationStatus,
      wave: c.wave,
      notifiedAt: c.notifiedAt,
      respondedAt: c.respondedAt
    }));
  }

  // System Metrics (Simulated demo metrics per Section 26 & 37)
  public getSystemMetrics(): SystemMetrics {
    const totalRequests = this.requests.size;
    const fulfilledRequests = Array.from(this.requests.values()).filter(
      r => r.status === 'FULFILLED' || r.status === 'RESERVED'
    ).length;
    const activeDonors = Array.from(this.donorProfiles.values()).filter(d => d.isAvailable && d.hasConsented).length;

    return {
      activeDonors,
      activeBloodBanks: this.bloodBanks.size,
      openRequests: Array.from(this.requests.values()).filter(
        r => r.status !== 'FULFILLED' && r.status !== 'CANCELLED' && r.status !== 'EXPIRED'
      ).length,
      matchesToday: 36,
      fulfilmentRate: 91.2, // synthetic demo value
      responseRate: 78.4,
      avgMatchTimeSeconds: 4.2,
      avgFulfilmentMinutes: 18.0,
      matchingAccuracy: 96.5,
      isSimulated: true
    };
  }

  public seedAll() {
    this.users.clear();
    this.donorProfiles.clear();
    this.bloodBanks.clear();
    this.hospitals.clear();
    this.inventory.clear();
    this.requests.clear();
    this.requestEvents.clear();
    this.matches.clear();
    this.notifications.clear();
    this.relayMessages.clear();
    this.nssCamps = [];

    // 1. Seed Core Demo Users
    const adminUser: User = {
      id: 'usr-admin-01',
      email: 'admin@ban.org',
      name: 'System Administrator',
      role: 'ADMIN',
      pincode: '680001',
      isVerified: true,
      verificationStatus: 'TRUSTED',
      createdAt: '2026-01-01T00:00:00Z'
    };
    this.users.set(adminUser.id, adminUser);

    const hospitalUser: User = {
      id: 'usr-hosp-abc',
      email: 'dr.thomas@abchospital.org',
      name: 'Dr. Thomas Mathew',
      role: 'HOSPITAL',
      pincode: '680001',
      isVerified: true,
      verificationStatus: 'TRUSTED',
      entityName: 'ABC Hospital, Thrissur',
      licenseNumber: 'KER-MED-2021-9921',
      hospitalId: 'hosp-abc',
      createdAt: '2026-01-10T00:00:00Z'
    };
    this.users.set(hospitalUser.id, hospitalUser);

    const bloodBankUser: User = {
      id: 'usr-bb-jubilee',
      email: 'bloodbank@jubileemission.org',
      name: 'Priya Nair (Transfusion Lead)',
      role: 'BLOOD_BANK',
      pincode: '680005',
      isVerified: true,
      verificationStatus: 'TRUSTED',
      entityName: 'Jubilee Mission Blood Centre',
      licenseNumber: 'BB-LIC-KL-4402',
      bloodBankId: 'bb-jubilee',
      createdAt: '2026-01-12T00:00:00Z'
    };
    this.users.set(bloodBankUser.id, bloodBankUser);

    const patientUser: User = {
      id: 'usr-pat-lakshmi',
      email: 'lakshmi.menon@family.net',
      name: 'Lakshmi Menon',
      role: 'PATIENT',
      pincode: '680001',
      isVerified: true,
      verificationStatus: 'CONFIRMED',
      createdAt: '2026-02-01T00:00:00Z'
    };
    this.users.set(patientUser.id, patientUser);

    const nssUser: User = {
      id: 'usr-nss-stthomas',
      email: 'nss@stthomas.ac.in',
      name: 'Prof. Haridas K. (NSS Officer)',
      role: 'NSS_PARTNER',
      pincode: '680001',
      isVerified: true,
      verificationStatus: 'TRUSTED',
      unitCollege: 'St. Thomas College NSS Unit #42',
      nssUnitId: 'camp-01',
      createdAt: '2026-01-15T00:00:00Z'
    };
    this.users.set(nssUser.id, nssUser);

    // 2. Seed 8 Hospitals
    const hospitalsList: Hospital[] = [
      {
        id: 'hosp-abc',
        name: 'ABC Hospital, Thrissur',
        licenseNumber: 'KER-MED-2021-9921',
        pincode: '680001',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.5276, lng: 76.2144 },
        isVerified: true,
        phone: '+91 487 242 0000',
        emergencyDepartmentPhone: '+91 487 242 9999',
        traumaLevel: 'Level 1 Trauma'
      },
      {
        id: 'hosp-jubilee',
        name: 'Jubilee Mission Medical College & Hospital',
        licenseNumber: 'KER-MED-1952-1002',
        pincode: '680005',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.5115, lng: 76.231 },
        isVerified: true,
        phone: '+91 487 243 2200',
        emergencyDepartmentPhone: '+91 487 243 2222',
        traumaLevel: 'Level 1 Trauma'
      },
      {
        id: 'hosp-amala',
        name: 'Amala Institute of Medical Sciences',
        licenseNumber: 'KER-MED-1978-3011',
        pincode: '680020',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.589, lng: 76.155 },
        isVerified: true,
        phone: '+91 487 230 4000',
        emergencyDepartmentPhone: '+91 487 230 4111',
        traumaLevel: 'Level 2 Trauma'
      },
      {
        id: 'hosp-aster-kochi',
        name: 'Aster Medcity',
        licenseNumber: 'KER-MED-2014-8831',
        pincode: '682027',
        district: 'Ernakulam',
        state: 'Kerala',
        location: { lat: 10.0456, lng: 76.2731 },
        isVerified: true,
        phone: '+91 484 669 9999',
        traumaLevel: 'Level 1 Trauma'
      },
      {
        id: 'hosp-aiims-delhi',
        name: 'AIIMS New Delhi',
        licenseNumber: 'DEL-CENT-1956-0001',
        pincode: '110029',
        district: 'New Delhi',
        state: 'Delhi',
        location: { lat: 28.5672, lng: 77.21 },
        isVerified: true,
        phone: '+91 11 2658 8500',
        traumaLevel: 'Apex Level 1 Trauma'
      },
      {
        id: 'hosp-lilavati-mumbai',
        name: 'Lilavati Hospital & Research Centre',
        licenseNumber: 'MAH-MED-1997-4412',
        pincode: '400050',
        district: 'Mumbai',
        state: 'Maharashtra',
        location: { lat: 19.0514, lng: 72.8296 },
        isVerified: true,
        phone: '+91 22 2675 1000',
        traumaLevel: 'Level 1 Trauma'
      },
      {
        id: 'hosp-manipal-blr',
        name: 'Manipal Hospital, Old Airport Road',
        licenseNumber: 'KAR-MED-1991-5509',
        pincode: '560017',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        location: { lat: 12.9592, lng: 77.649 },
        isVerified: true,
        phone: '+91 80 2502 4444',
        traumaLevel: 'Level 1 Trauma'
      },
      {
        id: 'hosp-apollo-chennai',
        name: 'Apollo Main Hospital, Greams Road',
        licenseNumber: 'TN-MED-1983-2281',
        pincode: '600006',
        district: 'Chennai',
        state: 'Tamil Nadu',
        location: { lat: 13.0567, lng: 80.2525 },
        isVerified: true,
        phone: '+91 44 2829 0200',
        traumaLevel: 'Level 1 Trauma'
      }
    ];
    for (const h of hospitalsList) {
      this.hospitals.set(h.id, h);
    }

    // 3. Seed 12 Blood Banks
    const banksList: BloodBank[] = [
      {
        id: 'bb-jubilee',
        name: 'Jubilee Mission Blood Centre',
        licenseNumber: 'BB-LIC-KL-4402',
        pincode: '680005',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.5115, lng: 76.231 },
        isVerified: true,
        operatingHours: '24/7 Transfusion Facility',
        emergencyCapable: true
      },
      {
        id: 'bb-amala',
        name: 'Amala Regional Blood Bank',
        licenseNumber: 'BB-LIC-KL-3391',
        pincode: '680020',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.589, lng: 76.155 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-thrissur-gen',
        name: 'District General Hospital Blood Bank',
        licenseNumber: 'BB-LIC-KL-1102',
        pincode: '680001',
        district: 'Thrissur',
        state: 'Kerala',
        location: { lat: 10.529, lng: 76.216 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-kochi-centre',
        name: 'Ernakulam District Blood Centre',
        licenseNumber: 'BB-LIC-KL-2201',
        pincode: '682016',
        district: 'Ernakulam',
        state: 'Kerala',
        location: { lat: 9.9674, lng: 76.2845 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-trivandrum-mc',
        name: 'Govt. Medical College Blood Bank TVM',
        licenseNumber: 'BB-LIC-KL-0012',
        pincode: '695001',
        district: 'Thiruvananthapuram',
        state: 'Kerala',
        location: { lat: 8.5241, lng: 76.9366 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-kozhikode-mc',
        name: 'Calicut Medical College Blood Centre',
        licenseNumber: 'BB-LIC-KL-5582',
        pincode: '673001',
        district: 'Kozhikode',
        state: 'Kerala',
        location: { lat: 11.2588, lng: 75.7804 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-redcross-delhi',
        name: 'Indian Red Cross Society Blood Bank',
        licenseNumber: 'BB-LIC-DL-0001',
        pincode: '110001',
        district: 'Central Delhi',
        state: 'Delhi',
        location: { lat: 28.6315, lng: 77.2167 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-kem-mumbai',
        name: 'KEM Blood Transfusion Centre',
        licenseNumber: 'BB-LIC-MH-3310',
        pincode: '400001',
        district: 'Mumbai',
        state: 'Maharashtra',
        location: { lat: 18.9401, lng: 72.8347 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-victoria-blr',
        name: 'Victoria Hospital Model Blood Bank',
        licenseNumber: 'BB-LIC-KA-7721',
        pincode: '560001',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        location: { lat: 12.9791, lng: 77.5913 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-rajivgandhi-chn',
        name: 'Rajiv Gandhi Govt General Hospital Blood Bank',
        licenseNumber: 'BB-LIC-TN-1188',
        pincode: '600001',
        district: 'Chennai',
        state: 'Tamil Nadu',
        location: { lat: 13.0924, lng: 80.2882 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-sskm-kolkata',
        name: 'SSKM Medical College Blood Bank',
        licenseNumber: 'BB-LIC-WB-9921',
        pincode: '700001',
        district: 'Kolkata',
        state: 'West Bengal',
        location: { lat: 22.5726, lng: 88.3639 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      },
      {
        id: 'bb-osmania-hyd',
        name: 'Osmania General Hospital Blood Bank',
        licenseNumber: 'BB-LIC-TS-4412',
        pincode: '500001',
        district: 'Hyderabad',
        state: 'Telangana',
        location: { lat: 17.385, lng: 78.4867 },
        isVerified: true,
        operatingHours: '24/7',
        emergencyCapable: true
      }
    ];
    for (const b of banksList) {
      this.bloodBanks.set(b.id, b);
    }

    // 4. Seed Blood Bank Inventory (Varied freshness & components)
    // Note: For Thrissur ABC Hospital request (O- Whole Blood 2 units), local banks have 0 units of O- Whole Blood to trigger the donor wave!
    // But other groups (A+, B+, O+, AB+, Plasma, Platelets) have healthy stocks.
    const sampleInventory: InventoryItem[] = [
      {
        id: 'inv-jub-01',
        bloodBankId: 'bb-jubilee',
        bloodBankName: 'Jubilee Mission Blood Centre',
        bloodGroup: 'O+',
        component: 'Red Cells',
        units: 18,
        collectionDate: new Date(Date.now() - 4 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 38 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 3600000).toISOString(),
        freshness: 'RECENT'
      },
      {
        id: 'inv-jub-02',
        bloodBankId: 'bb-jubilee',
        bloodBankName: 'Jubilee Mission Blood Centre',
        bloodGroup: 'A+',
        component: 'Whole Blood',
        units: 12,
        collectionDate: new Date(Date.now() - 1 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 34 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 1800000).toISOString(),
        freshness: 'FRESH'
      },
      {
        id: 'inv-jub-03',
        bloodBankId: 'bb-jubilee',
        bloodBankName: 'Jubilee Mission Blood Centre',
        bloodGroup: 'B+',
        component: 'Platelets',
        units: 6,
        collectionDate: new Date(Date.now() - 8 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 4 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 7200000).toISOString(),
        freshness: 'AGING'
      },
      {
        id: 'inv-jub-04',
        bloodBankId: 'bb-jubilee',
        bloodBankName: 'Jubilee Mission Blood Centre',
        bloodGroup: 'AB+',
        component: 'Plasma',
        units: 15,
        collectionDate: new Date(Date.now() - 20 * 86400000).toISOString(),
        expiryDate: new Date(Date.now() + 300 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 10800000).toISOString(),
        freshness: 'RECENT'
      },
      {
        id: 'inv-gen-01',
        bloodBankId: 'bb-thrissur-gen',
        bloodBankName: 'District General Hospital Blood Bank',
        bloodGroup: 'O+',
        component: 'Whole Blood',
        units: 8,
        collectionDate: new Date(Date.now() - 2 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 3600000).toISOString(),
        freshness: 'RECENT'
      },
      {
        id: 'inv-gen-02',
        bloodBankId: 'bb-thrissur-gen',
        bloodBankName: 'District General Hospital Blood Bank',
        bloodGroup: 'B-',
        component: 'Red Cells',
        units: 4,
        collectionDate: new Date(Date.now() - 30 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 28 * 3600000).toISOString(),
        freshness: 'STALE'
      },
      {
        id: 'inv-amala-01',
        bloodBankId: 'bb-amala',
        bloodBankName: 'Amala Regional Blood Bank',
        bloodGroup: 'A-',
        component: 'Whole Blood',
        units: 5,
        collectionDate: new Date(Date.now() - 5 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 4 * 3600000).toISOString(),
        freshness: 'RECENT'
      },
      {
        id: 'inv-amala-02',
        bloodBankId: 'bb-amala',
        bloodBankName: 'Amala Regional Blood Bank',
        bloodGroup: 'O+',
        component: 'Platelets',
        units: 7,
        collectionDate: new Date(Date.now() - 2 * 3600000).toISOString(),
        expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        status: 'AVAILABLE',
        lastUpdated: new Date(Date.now() - 1 * 3600000).toISOString(),
        freshness: 'FRESH'
      }
    ];
    for (const item of sampleInventory) {
      this.inventory.set(item.id, item);
    }

    // 5. Seed ~842 Donors
    // We calibrate carefully:
    // For Thrissur ABC Hospital (Lat 10.5276, Lng 76.2144, Pincode 680001):
    // Exactly 23 potential O- donors in Thrissur region.
    // 11 eligible (interval >= 90 days, no illness, consented, verified).
    // 6 within 5 km of ABC Hospital.
    // Top 3 in first wave: D-014 (Accepted), D-207, D-092.
    this.seedDonors();

    // 6. Seed NSS Camps
    this.nssCamps = [
      {
        id: 'camp-01',
        unitName: 'St. Thomas College NSS Unit #42',
        venue: 'College Indoor Stadium, Thrissur',
        date: '2026-10-18',
        pincode: '680001',
        targetUnits: 150,
        collectedUnits: 0,
        status: 'SCHEDULED'
      },
      {
        id: 'camp-02',
        unitName: 'Vimala College NSS Unit #11',
        venue: 'Auditorium Hall, Ramavarmapuram',
        date: '2026-10-25',
        pincode: '680008',
        targetUnits: 120,
        collectedUnits: 0,
        status: 'SCHEDULED'
      },
      {
        id: 'camp-03',
        unitName: 'Govt. Engineering College NSS',
        venue: 'Main Seminar Complex',
        date: '2026-09-15',
        pincode: '680009',
        targetUnits: 180,
        collectedUnits: 194,
        status: 'COMPLETED'
      }
    ];

    // 7. Seed 7 Open Requests (including the benchmark BAN-10291)
    this.seedRequests();
  }

  private seedDonors() {
    const bloodGroups: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
    const keralaPincodes = ['680001', '680002', '680003', '680004', '680005', '680006', '680007', '680008', '680020'];
    const otherPincodes = ['110001', '400001', '560001', '600001', '700001', '500001', '411001', '682001', '695001'];

    // We will generate the 842 donors with fixed reproducible pseudo-random seed
    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // First: Explicitly construct the Thrissur Benchmark O- Donors to ensure exact match counts!
    // Total 23 potential O- in Thrissur:
    // 11 eligible:
    // 6 within 5 km:
    //  - D-014 (Thrissur 680001, ~2.1 km, 110 days since donation, active, responseRate: 0.95) -> ACCEPTED
    //  - D-207 (Thrissur 680002, ~3.4 km, 140 days, responseRate: 0.88) -> SENT
    //  - D-092 (Thrissur 680006, ~4.1 km, 95 days, responseRate: 0.82) -> SENT
    //  - D-115 (Thrissur 680004, ~4.6 km, 180 days, responseRate: 0.75) -> Wave 2
    //  - D-341 (Thrissur 680003, ~3.8 km, 200 days, responseRate: 0.70) -> Wave 2
    //  - D-408 (Thrissur 680007, ~4.9 km, 105 days, responseRate: 0.65) -> Wave 2
    // 5 eligible beyond 5 km (5km - 15km):
    //  - D-512 (Amala 680020, ~8.2 km)
    //  - D-604 (Ramavarmapuram 680008, ~6.1 km)
    //  - D-718 (Guruvayur 680503, ~18.5 km)
    //  - D-722 (Ollur outskirts 680004, ~7.5 km)
    //  - D-735 (Koorkenchery south 680006, ~5.8 km)
    // 12 ineligible O- in Thrissur:
    //  - 5 with last donation < 90 days (cooldown active)
    //  - 4 with isAvailable = false
    //  - 2 with recent illness flag
    //  - 1 unverified account

    const thrissurBenchmarkDonors = [
      // 6 Eligible within 5 km (Top 3 are D-014, D-207, D-092)
      { code: 'D-014', name: 'Rahul Varma', pin: '680001', daysAgo: 110, rate: 0.95, act: 0.92, avail: true, consent: true, ver: true, note: 'Donor D-014 accepted BAN-10291' },
      { code: 'D-207', name: 'Ananya S.', pin: '680002', daysAgo: 140, rate: 0.88, act: 0.84, avail: true, consent: true, ver: true },
      { code: 'D-092', name: 'Gopal Krishna', pin: '680006', daysAgo: 95, rate: 0.82, act: 0.78, avail: true, consent: true, ver: true },
      { code: 'D-115', name: 'Divya Nair', pin: '680004', daysAgo: 180, rate: 0.75, act: 0.70, avail: true, consent: true, ver: true },
      { code: 'D-341', name: 'Arun Kumar', pin: '680003', daysAgo: 200, rate: 0.70, act: 0.65, avail: true, consent: true, ver: true },
      { code: 'D-408', name: 'Kavitha P.', pin: '680007', daysAgo: 105, rate: 0.65, act: 0.60, avail: true, consent: true, ver: true },

      // 5 Eligible beyond 5 km
      { code: 'D-512', name: 'Sanjay Menon', pin: '680020', daysAgo: 150, rate: 0.80, act: 0.75, avail: true, consent: true, ver: true },
      { code: 'D-604', name: 'Reshma R.', pin: '680008', daysAgo: 130, rate: 0.85, act: 0.80, avail: true, consent: true, ver: true },
      { code: 'D-718', name: 'Vishnu Das', pin: '680503', daysAgo: 220, rate: 0.78, act: 0.72, avail: true, consent: true, ver: true },
      { code: 'D-722', name: 'Meera Mohan', pin: '680004', daysAgo: 160, rate: 0.72, act: 0.68, avail: true, consent: true, ver: true },
      { code: 'D-735', name: 'Pradeep K.', pin: '680006', daysAgo: 115, rate: 0.68, act: 0.64, avail: true, consent: true, ver: true },

      // 12 Ineligible O- in Thrissur
      { code: 'D-801', name: 'Ineligible 1', pin: '680001', daysAgo: 25, rate: 0.8, act: 0.7, avail: true, consent: true, ver: true, note: 'Recent donation cooldown (<90d)' },
      { code: 'D-802', name: 'Ineligible 2', pin: '680002', daysAgo: 45, rate: 0.7, act: 0.6, avail: true, consent: true, ver: true, note: 'Cooldown (<90d)' },
      { code: 'D-803', name: 'Ineligible 3', pin: '680003', daysAgo: 60, rate: 0.6, act: 0.5, avail: true, consent: true, ver: true, note: 'Cooldown (<90d)' },
      { code: 'D-804', name: 'Ineligible 4', pin: '680004', daysAgo: 15, rate: 0.9, act: 0.8, avail: true, consent: true, ver: true, note: 'Cooldown (<90d)' },
      { code: 'D-805', name: 'Ineligible 5', pin: '680005', daysAgo: 70, rate: 0.8, act: 0.7, avail: true, consent: true, ver: true, note: 'Cooldown (<90d)' },
      { code: 'D-806', name: 'Ineligible 6', pin: '680001', daysAgo: 120, rate: 0.5, act: 0.5, avail: false, consent: true, ver: true, note: 'Marked unavailable' },
      { code: 'D-807', name: 'Ineligible 7', pin: '680002', daysAgo: 130, rate: 0.4, act: 0.4, avail: false, consent: true, ver: true, note: 'Marked unavailable' },
      { code: 'D-808', name: 'Ineligible 8', pin: '680006', daysAgo: 140, rate: 0.6, act: 0.5, avail: false, consent: true, ver: true, note: 'Marked unavailable' },
      { code: 'D-809', name: 'Ineligible 9', pin: '680007', daysAgo: 110, rate: 0.3, act: 0.3, avail: false, consent: true, ver: true, note: 'Marked unavailable' },
      { code: 'D-810', name: 'Ineligible 10', pin: '680001', daysAgo: 150, rate: 0.7, act: 0.6, avail: true, consent: true, ver: true, note: 'Recent medication/illness' },
      { code: 'D-811', name: 'Ineligible 11', pin: '680005', daysAgo: 180, rate: 0.7, act: 0.6, avail: true, consent: true, ver: true, note: 'Underweight / travel history' },
      { code: 'D-812', name: 'Ineligible 12', pin: '680008', daysAgo: 200, rate: 0.5, act: 0.4, avail: true, consent: false, ver: false, note: 'No consent provided' }
    ];

    for (const d of thrissurBenchmarkDonors) {
      const uId = `usr-${d.code.toLowerCase()}`;
      const user: User = {
        id: uId,
        name: d.name,
        email: `${d.code.toLowerCase()}@donormail.net`,
        role: 'DONOR',
        pincode: d.pin,
        isVerified: d.ver,
        verificationStatus: d.ver ? 'CONFIRMED' : 'PENDING',
        createdAt: '2026-01-05T00:00:00Z',
        phone: '+91 98470 ' + Math.floor(10000 + rnd() * 90000)
      };
      this.users.set(uId, user);

      const pInfo = lookupPincode(d.pin)!;
      const coarseLoc = getCoarseDonorLocation(pInfo.lat, pInfo.lng, d.code);
      const lastDon = new Date(Date.now() - d.daysAgo * 86400000).toISOString();
      const nextEligible = new Date(new Date(lastDon).getTime() + 90 * 86400000).toISOString();
      const isD014 = d.code === 'D-014';

      const profile: DonorProfile = {
        id: `prof-${d.code.toLowerCase()}`,
        userId: uId,
        candidateCode: d.code,
        bloodGroup: 'O-',
        pincode: d.pin,
        approxLocation: {
          lat: coarseLoc.lat,
          lng: coarseLoc.lng,
          district: pInfo.district,
          state: pInfo.state
        },
        isAvailable: d.avail,
        hasConsented: d.consent,
        emergencyAlertsOptIn: d.code !== 'D-806', // D-806 specifically opted out of emergency alerts
        alertsConsentUpdatedAt: '2026-01-05T00:00:00Z',
        lastDonationDate: lastDon,
        nextEligibleDonationDate: nextEligible,
        donationCount: Math.floor(1 + rnd() * 8),
        responseRate: d.rate,
        recentActivityScore: d.act,
        eligibilityNotes: d.note,
        healthDetails: {
          weightKg: isD014 ? 68 : Math.floor(52 + rnd() * 26),
          recentIllness: false,
          recentMedication: false,
          recentTravel: false,
          selfReportedFit: true,
          lastReportedAt: '2026-09-15T00:00:00Z',
          notes: 'Indicative self-report: Fit and ready for voluntary emergency phlebotomy.'
        },
        rewards: {
          points: isD014 ? 450 : 120,
          badges: [
            { id: 'b1', name: 'Universal O- Guardian', description: 'Universal donor dedicated to life-critical pediatric and surgical trauma', earnedAt: '2026-01-05', icon: 'shield' },
            { id: 'b2', name: 'Rapid Dispatch Responder', description: 'Consistently responds to SOS alerts within the 180s wave window', earnedAt: '2026-02-14', icon: 'zap' }
          ],
          availableOffers: [
            {
              id: 'off-01',
              partnerName: 'Apex Diagnostic Care',
              title: 'Free Annual Preventive Lipid & HbA1c Panel',
              description: 'Comprehensive blood chemistry wellness panel at Apex collection centers across Kerala.',
              category: 'HEALTH',
              pointsCost: 200,
              isSyntheticDemo: true,
              privacyAssurance: 'No health details or identity shared with partner. Anonymous voucher code validation.'
            },
            {
              id: 'off-02',
              partnerName: 'Kerala Urban Metro & Bus Transit',
              title: '5-Ride Express Transit Card Voucher',
              description: 'Complimentary transit pass for volunteer transport to recognized transfusion medical centres.',
              category: 'TRANSIT',
              pointsCost: 150,
              isSyntheticDemo: true,
              privacyAssurance: 'Pseudonymous QR transit token; zero biometric or phone linkage.'
            },
            {
              id: 'off-03',
              partnerName: 'GreenLeaf Nutrition',
              title: 'Post-Donation Hydration & Iron Care Box',
              description: 'Organic electrolyte hydration and dietary iron support package for voluntary donors.',
              category: 'NUTRITION',
              pointsCost: 100,
              isSyntheticDemo: true,
              privacyAssurance: 'Direct home parcel delivery without revealing medical donation logs.'
            }
          ],
          redeemedOffers: []
        }
      };
      this.donorProfiles.set(d.code, profile);
    }

    // Now seed the remaining ~819 donors across other groups & cities to total 842 donors
    const targetTotal = 842;
    const remainingToSeed = targetTotal - thrissurBenchmarkDonors.length;

    for (let i = 1; i <= remainingToSeed; i++) {
      const numCode = 1000 + i;
      const code = `D-${numCode}`;
      const groupIndex = Math.floor(rnd() * bloodGroups.length);
      let group = bloodGroups[groupIndex];
      // Keep O- rare in Thrissur to preserve the exact benchmark of 23
      const isThrissur = rnd() < 0.25;
      const pin = isThrissur
        ? keralaPincodes[Math.floor(rnd() * keralaPincodes.length)]
        : otherPincodes[Math.floor(rnd() * otherPincodes.length)];

      if (isThrissur && group === 'O-') {
        // Swap to O+ to keep Thrissur O- potential exactly at 23
        group = 'O+';
      }

      const pInfo = lookupPincode(pin) || lookupPincode('680001')!;
      const coarseLoc = getCoarseDonorLocation(pInfo.lat, pInfo.lng, code);
      const isAvailable = rnd() > 0.15;
      const hasConsented = rnd() > 0.05;
      const daysAgo = Math.floor(15 + rnd() * 240);
      const lastDon = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const nextEligible = new Date(new Date(lastDon).getTime() + 90 * 86400000).toISOString();

      const uId = `usr-${code.toLowerCase()}`;
      const user: User = {
        id: uId,
        name: `Donor Volunteer ${numCode}`,
        email: `volunteer${numCode}@donormail.net`,
        role: 'DONOR',
        pincode: pin,
        isVerified: true,
        verificationStatus: 'CONFIRMED',
        createdAt: '2026-02-10T00:00:00Z',
        phone: '+91 97' + Math.floor(10000000 + rnd() * 90000000)
      };
      this.users.set(uId, user);

      const profile: DonorProfile = {
        id: `prof-${code.toLowerCase()}`,
        userId: uId,
        candidateCode: code,
        bloodGroup: group,
        pincode: pin,
        approxLocation: {
          lat: coarseLoc.lat,
          lng: coarseLoc.lng,
          district: pInfo.district,
          state: pInfo.state
        },
        isAvailable,
        hasConsented,
        emergencyAlertsOptIn: rnd() > 0.08,
        alertsConsentUpdatedAt: '2026-02-10T00:00:00Z',
        lastDonationDate: lastDon,
        nextEligibleDonationDate: nextEligible,
        donationCount: Math.floor(rnd() * 6),
        responseRate: Math.round((0.55 + rnd() * 0.4) * 100) / 100,
        recentActivityScore: Math.round((0.5 + rnd() * 0.45) * 100) / 100,
        healthDetails: {
          weightKg: Math.floor(52 + rnd() * 28),
          recentIllness: false,
          recentMedication: false,
          recentTravel: false,
          selfReportedFit: true,
          lastReportedAt: '2026-09-01T00:00:00Z'
        },
        rewards: {
          points: Math.floor(60 + rnd() * 240),
          badges: [
            { id: 'b-vol', name: 'Verified Contributor', description: 'Registered in voluntary donor roster', earnedAt: '2026-02-10', icon: 'heart' }
          ],
          availableOffers: [
            {
              id: 'off-01',
              partnerName: 'Apex Diagnostic Care',
              title: 'Free Annual Preventive Lipid & HbA1c Panel',
              description: 'Comprehensive blood chemistry wellness panel at Apex collection centers across Kerala.',
              category: 'HEALTH',
              pointsCost: 200,
              isSyntheticDemo: true,
              privacyAssurance: 'No health details or identity shared with partner. Anonymous voucher code validation.'
            },
            {
              id: 'off-02',
              partnerName: 'Kerala Urban Metro & Bus Transit',
              title: '5-Ride Express Transit Card Voucher',
              description: 'Complimentary transit pass for volunteer transport to recognized transfusion medical centres.',
              category: 'TRANSIT',
              pointsCost: 150,
              isSyntheticDemo: true,
              privacyAssurance: 'Pseudonymous QR transit token; zero biometric or phone linkage.'
            }
          ],
          redeemedOffers: []
        }
      };
      this.donorProfiles.set(code, profile);
    }
  }

  private seedRequests() {
    // Benchmark Request BAN-10291
    const ban10291: EmergencyRequest = {
      id: 'BAN-10291',
      requesterId: 'usr-hosp-abc',
      requesterName: 'Dr. Thomas Mathew',
      requesterRole: 'HOSPITAL',
      patientReferenceId: 'PT-TH-99402',
      bloodGroup: 'O-',
      component: 'Whole Blood',
      unitsRequested: 2,
      unitsFulfilled: 1,
      urgency: 'CRITICAL',
      hospitalId: 'hosp-abc',
      hospitalName: 'ABC Hospital, Thrissur',
      pincode: '680001',
      location: { lat: 10.5276, lng: 76.2144 },
      requiredBy: new Date(Date.now() + 3 * 3600000).toISOString(),
      status: 'MATCHED',
      verificationState: 'TRUSTED',
      notes: 'Urgent cardiac surgery trauma case. Immediate blood required.',
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      donorCandidatesCount: 3
    };
    this.requests.set(ban10291.id, ban10291);

    // Request Events
    this.requestEvents.set(ban10291.id, [
      {
        id: 'evt-1',
        requestId: ban10291.id,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        eventType: 'REQUEST_CREATED',
        description: 'Emergency request BAN-10291 created by ABC Hospital for 2 units O- Whole Blood.',
        actor: 'Dr. Thomas Mathew'
      },
      {
        id: 'evt-2',
        requestId: ban10291.id,
        timestamp: new Date(Date.now() - 44 * 60000).toISOString(),
        eventType: 'SEARCH_BANKS',
        description: 'Bank-first check: 0 units O- Whole Blood in local blood banks. Escalating to donor network.',
        actor: 'Matching Engine'
      },
      {
        id: 'evt-3',
        requestId: ban10291.id,
        timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
        eventType: 'WAVE_1_NOTIFIED',
        description: 'Wave 1 SOS dispatched to top 3 anonymous candidates (D-014, D-207, D-092) within 5 km.',
        actor: 'Notification Dispatcher'
      },
      {
        id: 'evt-4',
        requestId: ban10291.id,
        timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
        eventType: 'DONOR_ACCEPTED',
        description: 'Candidate D-014 accepted emergency SOS. Transfusion unit notified.',
        actor: 'Candidate D-014'
      }
    ]);

    // Matches for BAN-10291 (Anonymized candidate table per Section 36)
    const matches10291: CandidateMatch[] = [
      {
        candidateId: 'D-014',
        requestId: ban10291.id,
        bloodGroup: 'O-',
        approxDistanceKm: 2.1,
        matchScore: 0.94,
        scores: {
          proximityScore: 0.95,
          groupScore: 1.0,
          responseScore: 0.95,
          activityScore: 0.92
        },
        notificationStatus: 'ACCEPTED',
        wave: 1,
        notifiedAt: new Date(Date.now() - 42 * 60000).toISOString(),
        respondedAt: new Date(Date.now() - 32 * 60000).toISOString()
      },
      {
        candidateId: 'D-207',
        requestId: ban10291.id,
        bloodGroup: 'O-',
        approxDistanceKm: 3.4,
        matchScore: 0.88,
        scores: {
          proximityScore: 0.85,
          groupScore: 1.0,
          responseScore: 0.88,
          activityScore: 0.84
        },
        notificationStatus: 'SENT',
        wave: 1,
        notifiedAt: new Date(Date.now() - 42 * 60000).toISOString()
      },
      {
        candidateId: 'D-092',
        requestId: ban10291.id,
        bloodGroup: 'O-',
        approxDistanceKm: 4.1,
        matchScore: 0.81,
        scores: {
          proximityScore: 0.78,
          groupScore: 1.0,
          responseScore: 0.82,
          activityScore: 0.78
        },
        notificationStatus: 'SENT',
        wave: 1,
        notifiedAt: new Date(Date.now() - 42 * 60000).toISOString()
      }
    ];
    this.matches.set(ban10291.id, matches10291);

    // Notifications for D-014
    this.notifications.set('D-014', [
      {
        id: 'notif-d014-1',
        requestId: ban10291.id,
        bloodGroup: 'O-',
        component: 'Whole Blood',
        units: 2,
        urgency: 'CRITICAL',
        approxArea: 'Thrissur Head Office (Near Swaraj Round)',
        hospitalName: 'ABC Hospital, Thrissur',
        createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
        status: 'ACCEPTED',
        channel: 'IN_APP',
        isSimulated: false
      }
    ]);

    // Structured Relay Messages for BAN-10291
    this.relayMessages.set(ban10291.id, [
      {
        id: 'msg-01',
        requestId: ban10291.id,
        senderRole: 'DONOR',
        senderCandidateId: 'D-014',
        message: 'On my way to the designated blood bank/hospital.',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        isStructured: true,
        status: 'DELIVERED'
      },
      {
        id: 'msg-02',
        requestId: ban10291.id,
        senderRole: 'HOSPITAL',
        message: 'Reception team is alerted. Please proceed directly to Room 104 Transfusion Wing.',
        timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
        isStructured: true,
        status: 'DELIVERED'
      }
    ]);

    // 6 other requests across Indian cities (total 7 open requests)
    const otherRequests: EmergencyRequest[] = [
      {
        id: 'BAN-10292',
        requesterId: 'usr-bb-jubilee',
        requesterName: 'Priya Nair',
        requesterRole: 'BLOOD_BANK',
        bloodGroup: 'A+',
        component: 'Platelets',
        unitsRequested: 4,
        unitsFulfilled: 4,
        urgency: 'HIGH',
        hospitalName: 'Jubilee Mission Hospital',
        pincode: '680005',
        location: { lat: 10.5115, lng: 76.231 },
        requiredBy: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'RESERVED',
        verificationState: 'TRUSTED',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 3600000).toISOString()
      },
      {
        id: 'BAN-10293',
        requesterId: 'usr-pat-lakshmi',
        requesterName: 'Lakshmi Menon',
        requesterRole: 'PATIENT',
        patientReferenceId: 'FAM-KER-441',
        bloodGroup: 'B+',
        component: 'Red Cells',
        unitsRequested: 1,
        unitsFulfilled: 0,
        urgency: 'MODERATE',
        hospitalName: 'District General Hospital',
        pincode: '680001',
        location: { lat: 10.5276, lng: 76.2144 },
        requiredBy: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'SEARCHING_BANKS',
        verificationState: 'UNVERIFIED',
        notes: 'Pre-surgery preparation. Seeking available stock in Thrissur.',
        createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        id: 'BAN-10294',
        requesterId: 'usr-hosp-amala',
        requesterName: 'Amala Emergency Unit',
        requesterRole: 'HOSPITAL',
        hospitalId: 'hosp-amala',
        bloodGroup: 'AB-',
        component: 'Plasma',
        unitsRequested: 2,
        unitsFulfilled: 2,
        urgency: 'HIGH',
        hospitalName: 'Amala Institute of Medical Sciences',
        pincode: '680020',
        location: { lat: 10.589, lng: 76.155 },
        requiredBy: new Date(Date.now() + 6 * 3600000).toISOString(),
        status: 'FULFILLED',
        verificationState: 'TRUSTED',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'BAN-10295',
        requesterId: 'usr-delhi-01',
        requesterName: 'AIIMS Emergency Triage',
        requesterRole: 'HOSPITAL',
        hospitalId: 'hosp-aiims-delhi',
        bloodGroup: 'O+',
        component: 'Whole Blood',
        unitsRequested: 4,
        unitsFulfilled: 2,
        urgency: 'CRITICAL',
        hospitalName: 'AIIMS New Delhi',
        pincode: '110029',
        location: { lat: 28.5672, lng: 77.21 },
        requiredBy: new Date(Date.now() + 2 * 3600000).toISOString(),
        status: 'PARTIALLY_MATCHED',
        verificationState: 'TRUSTED',
        createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 60000).toISOString()
      },
      {
        id: 'BAN-10296',
        requesterId: 'usr-mum-01',
        requesterName: 'Lilavati Trauma Unit',
        requesterRole: 'HOSPITAL',
        hospitalId: 'hosp-lilavati',
        bloodGroup: 'B-',
        component: 'Red Cells',
        unitsRequested: 2,
        unitsFulfilled: 0,
        urgency: 'HIGH',
        hospitalName: 'Lilavati Hospital, Mumbai',
        pincode: '400050',
        location: { lat: 19.0514, lng: 72.8296 },
        requiredBy: new Date(Date.now() + 10 * 3600000).toISOString(),
        status: 'DONORS_NOTIFIED',
        verificationState: 'TRUSTED',
        createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60000).toISOString()
      },
      {
        id: 'BAN-10297',
        requesterId: 'usr-blr-01',
        requesterName: 'Manipal Emergency Lead',
        requesterRole: 'HOSPITAL',
        hospitalId: 'hosp-manipal',
        bloodGroup: 'O-',
        component: 'Platelets',
        unitsRequested: 2,
        unitsFulfilled: 0,
        urgency: 'CRITICAL',
        hospitalName: 'Manipal Hospital, Bengaluru',
        pincode: '560017',
        location: { lat: 12.9592, lng: 77.649 },
        requiredBy: new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'SEARCHING_DONORS',
        verificationState: 'TRUSTED',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ];

    for (const req of otherRequests) {
      this.requests.set(req.id, req);
    }
  }

  // Two-Stage Matching Engine (Section 16, 17, 18)
  public executeMatchingEngine(requestId: string): {
    bankMatched: boolean;
    reservedUnits: number;
    donorWaveDispatched: boolean;
    candidateCount: number;
    candidates: CandidateMatch[];
    logs: string[];
  } {
    const logs: string[] = [];
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found.`);
    }

    logs.push(`Initiating matching for request ${requestId} (${request.bloodGroup} ${request.component}, ${request.unitsRequested} units)`);

    // 1. Bank-First check
    let unitsRemaining = request.unitsRequested - request.unitsFulfilled;
    let bankMatchedUnits = 0;

    // Check all blood banks within 25 km
    const compatibleBanks: { bank: BloodBank; item: InventoryItem; distKm: number }[] = [];
    for (const bank of this.bloodBanks.values()) {
      const dist = calculateDistanceKm(
        request.location.lat,
        request.location.lng,
        bank.location.lat,
        bank.location.lng
      );
      if (dist <= 25) {
        // Find matching inventory items
        for (const item of this.inventory.values()) {
          if (
            item.bloodBankId === bank.id &&
            item.status === 'AVAILABLE' &&
            item.component === request.component &&
            isBloodCompatible(request.bloodGroup, item.bloodGroup, request.component) &&
            new Date(item.expiryDate) > new Date() &&
            item.freshness !== 'STALE'
          ) {
            compatibleBanks.push({ bank, item, distKm: dist });
          }
        }
      }
    }

    // Sort by proximity
    compatibleBanks.sort((a, b) => a.distKm - b.distKm);

    for (const entry of compatibleBanks) {
      if (unitsRemaining <= 0) break;
      const takeUnits = Math.min(unitsRemaining, entry.item.units);
      entry.item.units -= takeUnits;
      if (entry.item.units === 0) {
        entry.item.status = 'RESERVED';
      }
      bankMatchedUnits += takeUnits;
      unitsRemaining -= takeUnits;
      request.matchedBankId = entry.bank.id;
      request.matchedBankName = entry.bank.name;
      logs.push(`Reserved ${takeUnits} units from ${entry.bank.name} (${entry.distKm} km away)`);
    }

    request.unitsFulfilled += bankMatchedUnits;

    if (unitsRemaining <= 0) {
      request.status = 'RESERVED';
      this.recordEvent(request.id, 'BANK_FULFILLED', `All requested units reserved through blood bank inventory.`, 'Matching Engine');
      return {
        bankMatched: true,
        reservedUnits: bankMatchedUnits,
        donorWaveDispatched: false,
        candidateCount: 0,
        candidates: [],
        logs
      };
    }

    if (bankMatchedUnits > 0) {
      request.status = 'PARTIALLY_MATCHED';
      this.recordEvent(request.id, 'BANK_PARTIAL', `Reserved ${bankMatchedUnits} units from bank. Searching donors for ${unitsRemaining} remaining units.`, 'Matching Engine');
    } else {
      logs.push(`No immediate blood-bank stock found. Searching verified donor network.`);
    }

    // 2. Donor Search: Stage 1 Hard Filters + Stage 2 Scoring
    const maxRadius = this.settings.firstWaveRadiusKm;
    const candidates: CandidateMatch[] = [];

    for (const donor of this.donorProfiles.values()) {
      // Hard Filters:
      // - Compatible group
      if (!isBloodCompatible(request.bloodGroup, donor.bloodGroup, request.component)) continue;
      // - Availability
      if (!donor.isAvailable) continue;
      // - Platform Consent
      if (!donor.hasConsented) continue;
      // - Emergency Alerts Notification Consent (Specific Opt-In setting)
      if (donor.emergencyAlertsOptIn === false) continue;
      // - 90 days cooldown for Whole Blood
      if (request.component === 'Whole Blood' && donor.lastDonationDate) {
        const daysSince = (Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000;
        if (daysSince < this.settings.wholeBloodCooldownDays) continue;
      }
      // - Distance check (Stage 1 radius)
      const dist = calculateDistanceKm(
        request.location.lat,
        request.location.lng,
        donor.approxLocation.lat,
        donor.approxLocation.lng
      );
      if (dist > maxRadius) continue;

      // Stage 2: Scoring Formula
      // MatchScore = 0.40 * ProximityScore + 0.25 * GroupScore + 0.20 * ResponseScore + 0.15 * ActivityScore
      const proximityScore = Math.max(0, 1 - dist / maxRadius);
      const groupScore = donor.bloodGroup === request.bloodGroup ? 1.0 : 0.85;
      const responseScore = donor.responseRate || 0.7;
      const activityScore = donor.recentActivityScore || 0.7;

      const matchScore =
        0.4 * proximityScore +
        0.25 * groupScore +
        0.2 * responseScore +
        0.15 * activityScore;

      candidates.push({
        candidateId: donor.candidateCode,
        requestId: request.id,
        bloodGroup: donor.bloodGroup,
        approxDistanceKm: dist,
        matchScore: Math.round(matchScore * 100) / 100,
        scores: {
          proximityScore: Math.round(proximityScore * 100) / 100,
          groupScore,
          responseScore,
          activityScore
        },
        notificationStatus: 'PENDING',
        wave: 1
      });
    }

    // Rank candidates: score DESC, distance ASC
    candidates.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.approxDistanceKm - b.approxDistanceKm;
    });

    // Notify top candidates (capped at maxWaveCandidates per Section 17)
    const topWaveCandidates = candidates.slice(0, this.settings.maxWaveCandidates);
    for (const c of topWaveCandidates) {
      c.notificationStatus = 'SENT';
      c.notifiedAt = new Date().toISOString();

      // Create donor notification record
      const notifList = this.notifications.get(c.candidateId) || [];
      notifList.unshift({
        id: `notif-${Date.now()}-${c.candidateId}`,
        requestId: request.id,
        bloodGroup: request.bloodGroup,
        component: request.component,
        units: request.unitsRequested,
        urgency: request.urgency,
        approxArea: request.hospitalName,
        hospitalName: request.hospitalName,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        channel: 'IN_APP',
        isSimulated: false
      });
      this.notifications.set(c.candidateId, notifList);
    }

    this.matches.set(request.id, topWaveCandidates);
    request.donorCandidatesCount = topWaveCandidates.length;
    request.status = topWaveCandidates.length > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING_DONORS';

    this.recordEvent(
      request.id,
      'WAVE_1_DISPATCHED',
      `Notified top ${topWaveCandidates.length} anonymous candidate(s) within ${maxRadius} km.`,
      'Matching Engine'
    );

    return {
      bankMatched: bankMatchedUnits > 0,
      reservedUnits: bankMatchedUnits,
      donorWaveDispatched: topWaveCandidates.length > 0,
      candidateCount: topWaveCandidates.length,
      candidates: topWaveCandidates,
      logs
    };
  }

  public recordEvent(requestId: string, eventType: string, description: string, actor: string) {
    const list = this.requestEvents.get(requestId) || [];
    list.push({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      requestId,
      timestamp: new Date().toISOString(),
      eventType,
      description,
      actor
    });
    this.requestEvents.set(requestId, list);
  }

  public updateDonorAlertsConsent(candidateCode: string, optIn: boolean): DonorProfile | null {
    const donor = this.donorProfiles.get(candidateCode);
    if (!donor) return null;
    donor.emergencyAlertsOptIn = !!optIn;
    donor.alertsConsentUpdatedAt = new Date().toISOString();
    return donor;
  }

  public updateDonorHealthDetails(
    candidateCode: string,
    updates: {
      weightKg?: number;
      recentIllness?: boolean;
      recentMedication?: boolean;
      recentTravel?: boolean;
      selfReportedFit?: boolean;
      notes?: string;
    }
  ): DonorProfile | null {
    const donor = this.donorProfiles.get(candidateCode);
    if (!donor) return null;
    donor.healthDetails = {
      weightKg: updates.weightKg !== undefined ? updates.weightKg : donor.healthDetails?.weightKg,
      recentIllness: updates.recentIllness !== undefined ? updates.recentIllness : !!donor.healthDetails?.recentIllness,
      recentMedication: updates.recentMedication !== undefined ? updates.recentMedication : !!donor.healthDetails?.recentMedication,
      recentTravel: updates.recentTravel !== undefined ? updates.recentTravel : !!donor.healthDetails?.recentTravel,
      selfReportedFit: updates.selfReportedFit !== undefined ? updates.selfReportedFit : !!donor.healthDetails?.selfReportedFit,
      lastReportedAt: new Date().toISOString(),
      notes: updates.notes || donor.healthDetails?.notes
    };
    return donor;
  }

  public redeemPartnerOffer(candidateCode: string, offerId: string): { success: boolean; voucher?: any; error?: string } {
    const donor = this.donorProfiles.get(candidateCode);
    if (!donor) return { success: false, error: 'Donor profile not found.' };
    if (!donor.rewards) return { success: false, error: 'No rewards profile active.' };

    const offer = donor.rewards.availableOffers.find(o => o.id === offerId);
    if (!offer) return { success: false, error: 'Partner offer not found.' };

    if (donor.rewards.points < offer.pointsCost) {
      return { success: false, error: `Insufficient voluntary points. Required: ${offer.pointsCost}, Balance: ${donor.rewards.points}` };
    }

    donor.rewards.points -= offer.pointsCost;
    const voucherCode = `BAN-${offer.category.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const redeemed = {
      offerId: offer.id,
      title: offer.title,
      partnerName: offer.partnerName,
      voucherCode,
      redeemedAt: new Date().toISOString()
    };
    donor.rewards.redeemedOffers.unshift(redeemed);
    return { success: true, voucher: redeemed };
  }
}

export const db = new DatabaseStore();
