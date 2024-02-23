import { NextResponse } from 'next/server';

export const GET = async () => {
  return new NextResponse(null, { status: 204 });
};
