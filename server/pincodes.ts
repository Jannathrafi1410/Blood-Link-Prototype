import { PincodeRecord } from '../src/types';

export const PINCODES_DATASET: Record<string, PincodeRecord> = {
  // Thrissur & Kerala
  '680001': { pincode: '680001', officeName: 'Thrissur Head Office', district: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  '680002': { pincode: '680002', officeName: 'Thrissur City', district: 'Thrissur', state: 'Kerala', lat: 10.5312, lng: 76.2201 },
  '680003': { pincode: '680003', officeName: 'Ayyanthole (Collectorate)', district: 'Thrissur', state: 'Kerala', lat: 10.5401, lng: 76.1952 },
  '680004': { pincode: '680004', officeName: 'Ollur', district: 'Thrissur', state: 'Kerala', lat: 10.4728, lng: 76.2415 },
  '680005': { pincode: '680005', officeName: 'Jubilee Mission / Kuriachira', district: 'Thrissur', state: 'Kerala', lat: 10.5115, lng: 76.2310 },
  '680006': { pincode: '680006', officeName: 'Koorkenchery', district: 'Thrissur', state: 'Kerala', lat: 10.4990, lng: 76.2185 },
  '680007': { pincode: '680007', officeName: 'Poonkunnam', district: 'Thrissur', state: 'Kerala', lat: 10.5450, lng: 76.2080 },
  '680008': { pincode: '680008', officeName: 'Ramavarmapuram (Police Academy)', district: 'Thrissur', state: 'Kerala', lat: 10.5620, lng: 76.2330 },
  '680020': { pincode: '680020', officeName: 'Amala Nagar (Medical College)', district: 'Thrissur', state: 'Kerala', lat: 10.5890, lng: 76.1550 },
  '680503': { pincode: '680503', officeName: 'Guruvayur', district: 'Thrissur', state: 'Kerala', lat: 10.5946, lng: 76.0416 },
  '682001': { pincode: '682001', officeName: 'Ernakulam Head Office', district: 'Ernakulam', state: 'Kerala', lat: 9.9816, lng: 76.2799 },
  '682016': { pincode: '682016', officeName: 'Kochi Central', district: 'Ernakulam', state: 'Kerala', lat: 9.9674, lng: 76.2845 },
  '695001': { pincode: '695001', officeName: 'Thiruvananthapuram GPO', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  '673001': { pincode: '673001', officeName: 'Kozhikode Head Office', district: 'Kozhikode', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  '686001': { pincode: '686001', officeName: 'Kottayam Head Office', district: 'Kottayam', state: 'Kerala', lat: 9.5916, lng: 76.5222 },
  '678001': { pincode: '678001', officeName: 'Palakkad Head Office', district: 'Palakkad', state: 'Kerala', lat: 10.7867, lng: 76.6548 },

  // Major Indian Cities across States / UTs
  '110001': { pincode: '110001', officeName: 'New Delhi GPO (Connaught Place)', district: 'Central Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167 },
  '400001': { pincode: '400001', officeName: 'Mumbai GPO (Fort)', district: 'Mumbai', state: 'Maharashtra', lat: 18.9401, lng: 72.8347 },
  '560001': { pincode: '560001', officeName: 'Bengaluru GPO (Cubbon Park)', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9791, lng: 77.5913 },
  '600001': { pincode: '600001', officeName: 'Chennai GPO (George Town)', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0924, lng: 80.2882 },
  '700001': { pincode: '700001', officeName: 'Kolkata GPO (Dalhousie)', district: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  '500001': { pincode: '500001', officeName: 'Hyderabad GPO (Abids)', district: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  '411001': { pincode: '411001', officeName: 'Pune Head Office', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  '380001': { pincode: '380001', officeName: 'Ahmedabad GPO', district: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  '302001': { pincode: '302001', officeName: 'Jaipur GPO', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  '226001': { pincode: '226001', officeName: 'Lucknow GPO', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  '800001': { pincode: '800001', officeName: 'Patna GPO', district: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  '781001': { pincode: '781001', officeName: 'Guwahati GPO', district: 'Kamrup', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  '160017': { pincode: '160017', officeName: 'Chandigarh Sector 17', district: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  '190001': { pincode: '190001', officeName: 'Srinagar GPO', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973 },
  '462001': { pincode: '462001', officeName: 'Bhopal Head Office', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  '751001': { pincode: '751001', officeName: 'Bhubaneswar GPO', district: 'Khurda', state: 'Odisha', lat: 20.2961, lng: 85.8245 }
};

// Indian Pincode validator regex: 6 digits starting with 1-8
export const PINCODE_REGEX = /^[1-8][0-9]{5}$/;

export function isValidPincode(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode.trim());
}

export function lookupPincode(pincode: string): PincodeRecord | null {
  const clean = pincode.trim();
  if (PINCODES_DATASET[clean]) {
    return PINCODES_DATASET[clean];
  }
  // If not exact match but valid 6-digit, synthesize deterministic district approximate centroid
  if (isValidPincode(clean)) {
    const prefix2 = clean.substring(0, 2);
    // Rough regional fallback
    let lat = 10.5276;
    let lng = 76.2144;
    let district = 'Kerala Region';
    let state = 'Kerala';

    if (prefix2.startsWith('68') || prefix2.startsWith('69') || prefix2.startsWith('67')) {
      lat = 10.5; lng = 76.2; district = 'Central Kerala'; state = 'Kerala';
    } else if (prefix2.startsWith('11')) {
      lat = 28.6; lng = 77.2; district = 'Delhi'; state = 'Delhi';
    } else if (prefix2.startsWith('40') || prefix2.startsWith('41')) {
      lat = 19.0; lng = 73.0; district = 'Western Maharashtra'; state = 'Maharashtra';
    } else if (prefix2.startsWith('56')) {
      lat = 12.9; lng = 77.6; district = 'Bengaluru Region'; state = 'Karnataka';
    } else if (prefix2.startsWith('60')) {
      lat = 13.0; lng = 80.2; district = 'Chennai Region'; state = 'Tamil Nadu';
    } else {
      lat = 20.5937; lng = 78.9629; district = 'National Region'; state = 'India';
    }

    return {
      pincode: clean,
      officeName: `Postal Office ${clean}`,
      district,
      state,
      lat,
      lng
    };
  }
  return null;
}

// Great-circle Haversine formula (PostGIS ST_Distance / ST_DWithin equivalence)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Coarse deterministic jitter for Donor Location Privacy (~1km coarse grid)
// Section 9: Never store or expose exact donor coordinates
export function getCoarseDonorLocation(baseLat: number, baseLng: number, donorSeed: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < donorSeed.length; i++) {
    hash = (hash << 5) - hash + donorSeed.charCodeAt(i);
    hash |= 0;
  }
  // Coarse ~0.008 to ~0.015 degrees jitter (~1 km resolution)
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const distanceDeg = 0.006 + ((Math.abs(hash >> 3) % 10) * 0.0008);
  return {
    lat: Math.round((baseLat + Math.cos(angle) * distanceDeg) * 1000) / 1000,
    lng: Math.round((baseLng + Math.sin(angle) * distanceDeg) * 1000) / 1000
  };
}
