import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  return new NextResponse(null, { status: 204 });
};
