import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { navigate, parseHash, paths, useRoute } from './router';

describe('parseHash', () => {
  it('maps empty, #/ and #/today to today', () => {
    ['', '#', '#/', '#/today'].forEach((hash) => {
      expect(parseHash(hash).name).toBe('today');
    });
  });

  it('parses leads with a search query', () => {
    expect(parseHash('#/leads')).toEqual({ name: 'leads', params: {}, query: {} });
    expect(parseHash('#/leads?q=ava%20m')).toEqual({ name: 'leads', params: {}, query: { q: 'ava m' } });
  });

  it('parses a lead id and decodes it', () => {
    expect(parseHash('#/leads/abc123').params).toEqual({ id: 'abc123' });
    expect(parseHash('#/leads/a%2Fb').params).toEqual({ id: 'a/b' });
    expect(parseHash('#/leads/abc123').name).toBe('lead');
  });

  it('parses tours with lead and date', () => {
    expect(parseHash('#/tours?lead=x1&date=2026-10-22')).toEqual({
      name: 'tours',
      params: {},
      query: { lead: 'x1', date: '2026-10-22' },
    });
  });

  it('treats anything else as notFound', () => {
    ['#/nope', '#/leads/a/b', '#design-system', '#/tours/1'].forEach((hash) => {
      expect(parseHash(hash).name).toBe('notFound');
    });
  });
});

describe('paths', () => {
  it('builds hash strings and omits empty params', () => {
    expect(paths.today()).toBe('#/today');
    expect(paths.leads()).toBe('#/leads');
    expect(paths.leads({ q: '' })).toBe('#/leads');
    expect(paths.leads({ q: 'ava m' })).toBe('#/leads?q=ava+m');
    expect(paths.lead('a/b')).toBe('#/leads/a%2Fb');
    expect(paths.tours()).toBe('#/tours');
    expect(paths.tours({ lead: 'x1' })).toBe('#/tours?lead=x1');
    expect(paths.tours({ lead: 'x1', date: '2026-10-22' })).toBe('#/tours?lead=x1&date=2026-10-22');
  });

  it('round-trips through parseHash', () => {
    expect(parseHash(paths.lead('a/b?c')).params.id).toBe('a/b?c');
    expect(parseHash(paths.leads({ q: 'a&b' })).query.q).toBe('a&b');
  });
});

describe('useRoute', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('updates on hashchange', async () => {
    window.location.hash = '';
    const { result } = renderHook(() => useRoute());
    expect(result.current.name).toBe('today');

    await act(async () => {
      navigate(paths.lead('abc'));
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(result.current.name).toBe('lead');
    expect(result.current.params.id).toBe('abc');
  });
});
