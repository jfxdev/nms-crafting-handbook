// SPDX-License-Identifier: GPL-3.0-or-later
// Hash routes: #/?q=&f=&c=  (search)   #/item/<id>?n=<qty>  (item page)

export type Route =
  | { name: 'search'; params: URLSearchParams }
  | { name: 'item'; id: string; params: URLSearchParams };

export function parseRoute(hash = location.hash): Route {
  const [path = '', query = ''] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  const m = /^\/item\/(.+)$/.exec(path);
  return m ? { name: 'item', id: decodeURIComponent(m[1]!), params } : { name: 'search', params };
}

export const itemHref = (id: string): string => `#/item/${encodeURIComponent(id)}`;

export function searchHref(params: URLSearchParams): string {
  const q = params.toString();
  return q ? `#/?${q}` : '#/';
}

/** Updates the URL without adding a history entry or triggering a re-render. */
export function replaceHash(hash: string): void {
  history.replaceState(history.state, '', hash);
}
