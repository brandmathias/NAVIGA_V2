const GOOGLE_MAP_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]);

function parseUrl(value) {
  try {
    return new URL(String(value ?? '').trim());
  } catch {
    return null;
  }
}

function isGoogleMapsUrl(value) {
  const url = parseUrl(value);
  if (!url || !/^https?:$/.test(url.protocol) || !GOOGLE_MAP_HOSTS.has(url.hostname)) return false;
  return url.hostname === 'maps.google.com' || url.hostname.endsWith('goo.gl') || url.pathname.startsWith('/maps');
}

function isGoogleMapsEmbedUrl(value) {
  const url = parseUrl(value);
  return isGoogleMapsUrl(value) && Boolean(url?.pathname.startsWith('/maps/embed'));
}

function getGoogleMapsEmbedUrl(mapUrl, address) {
  const savedUrl = String(mapUrl ?? '').trim();
  if (!savedUrl) return '';
  if (isGoogleMapsEmbedUrl(savedUrl)) return savedUrl;
  if (!isGoogleMapsUrl(savedUrl)) return '';

  const source = parseUrl(savedUrl);
  const location = source?.searchParams.get('q')?.trim() || String(address ?? '').trim();
  if (!location) return '';

  const embedUrl = new URL('https://maps.google.com/');
  embedUrl.searchParams.set('q', location);
  embedUrl.searchParams.set('output', 'embed');
  return embedUrl.toString();
}

module.exports = { getGoogleMapsEmbedUrl };
