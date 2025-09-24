import { config } from '../config/env.js';

// Returns E.164 if possible, otherwise null when input is empty; preserves leading + if valid
export function normalizePhoneE164(input) {
  if (!input) return null;
  const raw = String(input).trim();

  // Already E.164?
  if (/^\+\d{8,15}$/.test(raw)) return raw;

  // Remove non-digits
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // If starts with 00 (IDD), convert to +
  if (raw.startsWith('00')) {
    const intl = '+' + digits.slice(2);
    return /^\+\d{8,15}$/.test(intl) ? intl : null;
  }

  // If looks like full international without '+', accept as E.164 by prepending '+'
  if (digits.length >= 8 && digits.length <= 15 && (raw.startsWith('+') === false)) {
    const intl = '+' + digits;
    if (/^\+\d{8,15}$/.test(intl)) return intl;
  }

  // If local number (BR common 10-11 digits), prefix default country when configured
  const cc = (config.phone?.defaultCountryCode || '').replace(/\D/g, '');
  if (cc) {
    // Common case BR: 10-11 digits; but accept 8-13 as heuristic local length
    if (digits.length >= 8 && digits.length <= 13) {
      const intl = `+${cc}${digits}`;
      if (/^\+\d{8,15}$/.test(intl)) return intl;
    }
  }

  return null;
}

