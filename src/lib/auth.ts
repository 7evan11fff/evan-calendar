import { NextRequest } from 'next/server';

export function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;
  
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer') return false;
  
  return token === process.env.API_KEY;
}

export function validateWebSession(request: NextRequest): boolean {
  const cookie = request.cookies.get('calendar_auth');
  return cookie?.value === process.env.WEB_PASSWORD;
}
