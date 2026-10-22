interface ApiRequest {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

/**
 * Official Malaysia Department of Environment (DOE) APIMS Proxy
 * Fetches real-time hourly readings from the 68 official Malaysian monitoring stations.
 * Caches responses for 10 minutes (s-maxage=600) with 2-minute stale-while-revalidate window.
 */
export default async function handler(_req: ApiRequest, res: ApiResponse) {
  try {
    const upstreamUrl =
      'https://eqms.doe.gov.my/api3/publicmapproxy/PUBLIC_DISPLAY/CAQM_MCAQM_Current_Reading/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json';

    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TerraGuard/2.0; +https://terraguard.my)',
        Referer: 'https://eqms.doe.gov.my/APIMS/main',
        Accept: 'application/json'
      }
    });

    if (!upstream.ok) {
      throw new Error(`DOE APIMS upstream returned HTTP ${upstream.status}`);
    }

    const data = await upstream.json();

    // Cache on CDN for 10 minutes (600s), allowing stale-while-revalidate for 120s
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upstream error';
    return res.status(502).json({
      error: 'Failed to proxy official DOE APIMS data',
      message
    });
  }
}
