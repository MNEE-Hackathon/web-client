/**
 * Pinata Signed JWT Route Handler
 * 
 * Issues short-lived JWTs for client-side uploads to Pinata.
 * This keeps the main Pinata JWT secret on the server.
 * 
 * @see https://docs.pinata.cloud/sdk/signed-jwt
 */

import { NextRequest, NextResponse } from 'next/server';

// JWT expiration time (1 hour)
const JWT_EXPIRATION_SECONDS = 3600;

export async function POST(request: NextRequest) {
  try {
    // Get the main Pinata JWT from environment
    const pinataJwt = process.env.PINATA_JWT;
    
    if (!pinataJwt) {
      console.error('PINATA_JWT not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Parse request body for optional customization
    const body = await request.json().catch(() => ({}));
    const { fileName, fileType } = body as { fileName?: string; fileType?: string };

    // Create a signed JWT using Pinata's API
    const response = await fetch('https://api.pinata.cloud/v3/files/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires: JWT_EXPIRATION_SECONDS,
        date: Math.floor(Date.now() / 1000),
        // Optional: Add custom metadata
        ...(fileName && { name: fileName }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinata signing error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate upload token' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      jwt: data.data,
      expiresAt: Math.floor(Date.now() / 1000) + JWT_EXPIRATION_SECONDS,
    });

  } catch (error) {
    console.error('Signed JWT generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

