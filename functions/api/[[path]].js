const HOSTS = {
  bmcl: 'https://bmclapi2.bangbang93.com',
  forge: 'https://maven.minecraftforge.net',
  neoforge: 'https://maven.neoforged.net',
  fabric: 'https://meta.fabricmc.net',
  quilt: 'https://meta.quiltmc.org',
  quiltmaven: 'https://maven.quiltmc.org',
  piston: 'https://piston-meta.mojang.com',
  launcher: 'https://launchermeta.mojang.com',
  libs: 'https://libraries.minecraft.net',
  res: 'https://resources.download.minecraft.net'
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400'
};

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const seg = params.path;
  const parts = Array.isArray(seg) ? seg : (seg ? [seg] : []);
  if (parts.length < 2) return new Response('bad path', { status: 400, headers: CORS });

  const key = parts[0];
  const host = HOSTS[key];
  if (!host) return new Response('unknown target: ' + key, { status: 404, headers: CORS });

  const rest = parts.slice(1).join('/');
  const target = host + '/' + rest + (new URL(request.url).search || '');

  const headers = new Headers(request.headers);
  headers.delete('host'); headers.delete('origin'); headers.delete('referer');
  headers.set('User-Agent', 'Mozilla/5.0 (compatible; MCDL/1.0)');

  let upstream;
  try {
    upstream = await fetch(target, { method: request.method, headers, redirect: 'follow' });
  } catch (e) {
    return new Response('upstream error: ' + e.message, { status: 502, headers: CORS });
  }

  const out = new Headers(upstream.headers);
  for (const k in CORS) out.set(k, CORS[k]);
  out.set('Cache-Control', 'public, max-age=300');
  out.delete('content-security-policy');
  out.delete('x-frame-options');
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}