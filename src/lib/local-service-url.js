const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function requireLocalHttpUrl(value, settingName) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new Error(`${settingName} harus berupa URL HTTP localhost yang valid.`);
  }

  if (!['http:', 'https:'].includes(url.protocol) || !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(`${settingName} hanya boleh menunjuk ke service lokal di localhost.`);
  }

  return url;
}

function optionalLocalHttpUrl(value, settingName) {
  const configured = String(value ?? '').trim();
  return configured ? requireLocalHttpUrl(configured, settingName) : null;
}

module.exports = { optionalLocalHttpUrl, requireLocalHttpUrl };
