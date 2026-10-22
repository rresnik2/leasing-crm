import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLeadScores, { RETRY_DELAYS_MS } from './useLeadScores';

const openLead = { id: 'a', name: 'Ava Martinez', status: 'New Inquiry' };
const scoreData = { lead_id: 'a', score: 60, priority: 'Medium', recommended_action: 'Call' };

const ok = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(scoreData) });
const httpError = (status) => () => Promise.resolve({ ok: false, status });
const networkError = () => Promise.reject(new TypeError('Failed to fetch'));

// advance fake time and let the fetch -> json -> setState chain finish
const advance = (ms) => act(() => vi.advanceTimersByTimeAsync(ms));

// leads is created once so re-renders pass the same array, as App does
const render = (leads) => renderHook(() => useLeadScores(leads));

describe('useLeadScores', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('scores an open lead', async () => {
    const fetchMock = vi.fn(ok);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = render([openLead]);
    await advance(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.a).toEqual({ loading: false, data: scoreData });
  });

  it('retries failed requests and stays loading until one succeeds', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(networkError)
      .mockImplementationOnce(httpError(503))
      .mockImplementationOnce(ok);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = render([openLead]);
    await advance(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.a).toEqual({ loading: true, data: null });

    await advance(RETRY_DELAYS_MS[0]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.a.loading).toBe(true);

    await advance(RETRY_DELAYS_MS[1]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.a).toEqual({ loading: false, data: scoreData });
  });

  it('gives up after the last retry', async () => {
    const fetchMock = vi.fn(httpError(502));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = render([openLead]);
    await advance(0);
    await advance(RETRY_DELAYS_MS[0]);
    await advance(RETRY_DELAYS_MS[1]);

    expect(fetchMock).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length + 1);
    expect(result.current.a).toEqual({ loading: false, data: null });

    await advance(60000);
    expect(fetchMock).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length + 1);
  });

  it('does not retry when the API rejects the lead', async () => {
    const fetchMock = vi.fn(httpError(422));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = render([openLead]);
    await advance(0);
    await advance(60000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.a).toEqual({ loading: false, data: null });
  });

  it('skips finished leads', async () => {
    const fetchMock = vi.fn(ok);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = render([{ id: 'b', name: 'Lisa Thompson', status: 'Leased' }]);
    await advance(0);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });
});
