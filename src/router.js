import { useMemo, useSyncExternalStore } from 'react';

// Hash routes: #/today, #/leads?q=, #/leads/:id, #/tours?lead=&date=

// Turns a location hash into { name, params, query }.
export const parseHash = (hash = '') => {
  const raw = hash.replace(/^#/, '');
  const queryStart = raw.indexOf('?');
  const pathPart = queryStart === -1 ? raw : raw.slice(0, queryStart);
  const queryPart = queryStart === -1 ? '' : raw.slice(queryStart + 1);

  const query = Object.fromEntries(new URLSearchParams(queryPart));
  const segments = pathPart.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'today')) {
    return { name: 'today', params: {}, query };
  }
  if (segments[0] === 'leads' && segments.length === 1) {
    return { name: 'leads', params: {}, query };
  }
  if (segments[0] === 'leads' && segments.length === 2) {
    let id = segments[1];
    try {
      id = decodeURIComponent(id);
    } catch {
      // malformed escape: use the id as typed
    }
    return { name: 'lead', params: { id }, query };
  }
  if (segments[0] === 'tours' && segments.length === 1) {
    return { name: 'tours', params: {}, query };
  }
  return { name: 'notFound', params: {}, query };
};

// builds '#/path?a=b', leaving out empty params
const buildPath = (path, params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const text = search.toString();
  return text ? `#${path}?${text}` : `#${path}`;
};

export const paths = {
  today: () => '#/today',
  leads: ({ q } = {}) => buildPath('/leads', { q }),
  lead: (id) => `#/leads/${encodeURIComponent(id)}`,
  tours: ({ lead, date } = {}) => buildPath('/tours', { lead, date }),
};

// accepts a hash string from `paths`, with or without the leading '#'
export const navigate = (path) => {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
};

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};

const getHash = () => window.location.hash;

// Current route; re-renders on hashchange.
export function useRoute() {
  const hash = useSyncExternalStore(subscribe, getHash, () => '');
  return useMemo(() => parseHash(hash), [hash]);
}
