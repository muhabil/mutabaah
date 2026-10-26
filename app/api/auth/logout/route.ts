import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('mutabaah_session');
  response.cookies.delete('mutabaah_role');
  return response;
}
