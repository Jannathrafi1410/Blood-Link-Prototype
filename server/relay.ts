import { RelayMessage, UserRole } from '../src/types';

// Regex patterns to detect and block PII in SOS relay messages
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(\b[6-9]\d{9}\b)|(\b\d{5}[-.\s]?\d{5}\b)/i;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
const PINCODE_IN_MSG_REGEX = /\b[1-8]\d{5}\b/;
const ADDRESS_KEYWORDS_REGEX = /\b(flat\s*no|house\s*no|door\s*no|plot\s*no|street|road|nagar|colony|lane|avenue|sector|building|apartment)\b[\s\S]{0,30}\d+/i;

export interface SanitizationResult {
  isSafe: boolean;
  blockedReason?: string;
  cleanedText: string;
}

export function sanitizeRelayMessage(text: string): SanitizationResult {
  const trimmed = text.trim();

  if (PHONE_REGEX.test(trimmed)) {
    return {
      isSafe: false,
      blockedReason: 'Privacy violation: Direct telephone/mobile numbers are prohibited in relay messaging.',
      cleanedText: '[BLOCKED: Direct phone numbers prohibited]'
    };
  }

  if (EMAIL_REGEX.test(trimmed)) {
    return {
      isSafe: false,
      blockedReason: 'Privacy violation: Email addresses are prohibited in relay messaging.',
      cleanedText: '[BLOCKED: Direct email prohibited]'
    };
  }

  if (PINCODE_IN_MSG_REGEX.test(trimmed) || ADDRESS_KEYWORDS_REGEX.test(trimmed)) {
    return {
      isSafe: false,
      blockedReason: 'Privacy violation: Home or street addresses are prohibited in relay messaging.',
      cleanedText: '[BLOCKED: Address data prohibited]'
    };
  }

  return {
    isSafe: true,
    cleanedText: trimmed
  };
}

export const STRUCTURED_RELAY_PRESETS = [
  'On my way to the designated blood bank/hospital.',
  'Need directions to the blood bank transfusion unit.',
  'Traffic delay, running approximately 15 minutes late.',
  'Arrived at the transfusion center reception.',
  'Screening completed, proceeding with donation.',
  'Blood unit successfully received by hospital staff.'
];
