/**
 * Serverless Health Check Endpoint
 * Route: /api/health
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  service: string;
  hasMasKeyId: boolean;
  runtime: {
    nodeVersion: string;
    platform: string;
  };
}

/**
 * Standard Node / Express / Vercel Serverless Handler
 */
export default async function handler(req: any, res: any) {
  // CORS Headers
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, Authorization');
    res.setHeader('Content-Type', 'application/json');
  }

  // Handle preflight
  if (req?.method === 'OPTIONS') {
    if (res?.status) {
      return res.status(204).end();
    }
    return new Response(null, { status: 204 });
  }

  const hasMasKeyId = Boolean(process.env.MAS_KEY_ID && process.env.MAS_KEY_ID !== 'YOUR_MAS_KEY_ID');

  const healthData: HealthResponse = {
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
    service: 'SORA Singapore MAS API Connector',
    hasMasKeyId,
    runtime: {
      nodeVersion: process.version || 'unknown',
      platform: process.platform || 'unknown',
    },
  };

  if (res?.status && typeof res.status === 'function') {
    return res.status(200).json(healthData);
  }

  // Web Standard Response fallback
  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Web Standard / Edge Serverless export
 */
export async function GET(request: Request) {
  const hasMasKeyId = Boolean(process.env.MAS_KEY_ID && process.env.MAS_KEY_ID !== 'YOUR_MAS_KEY_ID');

  const healthData: HealthResponse = {
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    timestamp: new Date().toISOString(),
    service: 'SORA Singapore MAS API Connector',
    hasMasKeyId,
    runtime: {
      nodeVersion: process.version || 'unknown',
      platform: process.platform || 'unknown',
    },
  };

  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
