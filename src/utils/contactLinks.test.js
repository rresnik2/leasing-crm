import { describe, it, expect } from 'vitest';
import { mailtoHref, smsHref, telHref } from './contactLinks';

describe('telHref and smsHref', () => {
  it('normalizes valid phones to E.164', () => {
    expect(telHref('(206) 555-0123')).toBe('tel:+12065550123');
    expect(smsHref('206-555-0123')).toBe('sms:+12065550123');
  });

  it('encodes the sms body', () => {
    expect(smsHref('+12065550123', 'Hi Ava & co')).toBe('sms:+12065550123?body=Hi%20Ava%20%26%20co');
  });

  it('returns null for missing or invalid phones', () => {
    expect(telHref('')).toBeNull();
    expect(telHref(undefined)).toBeNull();
    expect(telHref('123')).toBeNull();
    expect(smsHref('nope', 'hi')).toBeNull();
  });
});

describe('mailtoHref', () => {
  it('builds a plain or parameterized link', () => {
    expect(mailtoHref('ava@example.com')).toBe('mailto:ava@example.com');
    expect(mailtoHref('ava@example.com', { subject: 'Your tour', body: 'See you at 2' })).toBe(
      'mailto:ava@example.com?subject=Your%20tour&body=See%20you%20at%202'
    );
  });

  it('returns null for missing or invalid emails', () => {
    expect(mailtoHref('')).toBeNull();
    expect(mailtoHref(null)).toBeNull();
    expect(mailtoHref('not an email')).toBeNull();
  });
});
