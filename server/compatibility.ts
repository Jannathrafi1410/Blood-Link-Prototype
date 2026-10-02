import { BloodGroup, BloodComponent, CompatibilityRule } from '../src/types';

export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  // Red Cells
  {
    component: 'Red Cells',
    recipientGroup: 'O-',
    compatibleDonorGroups: ['O-'],
    medicalReviewRequired: true,
    guidelines: 'O- is universal red cell donor but can only receive O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'O+',
    compatibleDonorGroups: ['O+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'O+ can receive O+ and O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'A-',
    compatibleDonorGroups: ['A-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'A- can receive A- and O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'A+',
    compatibleDonorGroups: ['A+', 'A-', 'O+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'A+ can receive A+, A-, O+, and O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'B-',
    compatibleDonorGroups: ['B-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'B- can receive B- and O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'B+',
    compatibleDonorGroups: ['B+', 'B-', 'O+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'B+ can receive B+, B-, O+, and O- red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'AB-',
    compatibleDonorGroups: ['AB-', 'A-', 'B-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'AB- can receive any Rh-negative red cells.'
  },
  {
    component: 'Red Cells',
    recipientGroup: 'AB+',
    compatibleDonorGroups: ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'AB+ is the universal red cell recipient.'
  },

  // Whole Blood: Default Recipient == Donor
  {
    component: 'Whole Blood',
    recipientGroup: 'O-',
    compatibleDonorGroups: ['O-'],
    medicalReviewRequired: true,
    guidelines: 'Whole Blood standard is recipient group identical to donor group.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'O+',
    compatibleDonorGroups: ['O+'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'A-',
    compatibleDonorGroups: ['A-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'A+',
    compatibleDonorGroups: ['A+', 'A-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'B-',
    compatibleDonorGroups: ['B-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'B+',
    compatibleDonorGroups: ['B+', 'B-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'AB-',
    compatibleDonorGroups: ['AB-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },
  {
    component: 'Whole Blood',
    recipientGroup: 'AB+',
    compatibleDonorGroups: ['AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Whole blood recipient identical group preferred.'
  },

  // Plasma (Rh ignored for plasma)
  {
    component: 'Plasma',
    recipientGroup: 'O-',
    compatibleDonorGroups: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. Plasma rules reverse red-cell compatibility.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'O+',
    compatibleDonorGroups: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'A+',
    compatibleDonorGroups: ['A+', 'A-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'A-',
    compatibleDonorGroups: ['A+', 'A-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'B+',
    compatibleDonorGroups: ['B+', 'B-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'B-',
    compatibleDonorGroups: ['B+', 'B-', 'AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'AB+',
    compatibleDonorGroups: ['AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. AB is universal plasma donor.'
  },
  {
    component: 'Plasma',
    recipientGroup: 'AB-',
    compatibleDonorGroups: ['AB+', 'AB-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. AB is universal plasma donor.'
  },

  // Platelets: ABO identical preferred with scoring boost
  {
    component: 'Platelets',
    recipientGroup: 'O-',
    compatibleDonorGroups: ['O-', 'O+', 'A-', 'B-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. ABO identical preferred; Rh-negative recipients prefer Rh-negative.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'O+',
    compatibleDonorGroups: ['O+', 'O-', 'A+', 'B+'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. ABO identical preferred.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'A+',
    compatibleDonorGroups: ['A+', 'A-', 'O+', 'AB+'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. ABO identical preferred.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'A-',
    compatibleDonorGroups: ['A-', 'A+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. Rh-negative recipients prefer Rh-negative.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'B+',
    compatibleDonorGroups: ['B+', 'B-', 'O+', 'AB+'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. ABO identical preferred.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'B-',
    compatibleDonorGroups: ['B-', 'B+', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. Rh-negative recipients prefer Rh-negative.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'AB+',
    compatibleDonorGroups: ['AB+', 'AB-', 'A+', 'B+', 'O+'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. ABO identical preferred.'
  },
  {
    component: 'Platelets',
    recipientGroup: 'AB-',
    compatibleDonorGroups: ['AB-', 'AB+', 'A-', 'B-', 'O-'],
    medicalReviewRequired: true,
    guidelines: 'Requires review by licensed transfusion medicine professional. Rh-negative recipients prefer Rh-negative.'
  }
];

export function getCompatibleDonorGroups(recipientGroup: BloodGroup, component: BloodComponent): BloodGroup[] {
  const match = COMPATIBILITY_RULES.find(
    r => r.recipientGroup === recipientGroup && r.component === component
  );
  if (match) {
    return match.compatibleDonorGroups;
  }
  // Safe default: identical group only
  return [recipientGroup];
}

export function isBloodCompatible(
  recipientGroup: BloodGroup,
  donorGroup: BloodGroup,
  component: BloodComponent
): boolean {
  const compatibleList = getCompatibleDonorGroups(recipientGroup, component);
  return compatibleList.includes(donorGroup);
}
