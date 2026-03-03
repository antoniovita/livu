import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(phone: string) {
  const parsed = parsePhoneNumberFromString(phone, 'BR');

  if (!parsed) {
    return phone;
  }

  return parsed.number;
}
