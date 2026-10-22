import { getE164Format, validatePhone } from './phoneUtils';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toQuery = (params) => {
  const parts = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const e164 = (phone) => (phone && validatePhone(phone) ? getE164Format(phone) : null);

export const telHref = (phone) => {
  const number = e164(phone);
  return number ? `tel:${number}` : null;
};

export const smsHref = (phone, body) => {
  const number = e164(phone);
  return number ? `sms:${number}${toQuery({ body })}` : null;
};

export const mailtoHref = (email, { subject, body } = {}) => {
  const address = (email ?? '').trim();
  if (!EMAIL_PATTERN.test(address)) return null;
  return `mailto:${address}${toQuery({ subject, body })}`;
};
