import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  try {
    // 1. Validate environment variables
    if (!process.env.NEXT_PUBLIC_AGENT_ID || !process.env.ELEVENLABS_API_KEY) {
      throw new Error('Missing required environment variables');
    }
    
    // 2. Build URL with agent
    const url = new URL(
      'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url',
    );
    url.searchParams.set('agent_id', process.env.NEXT_PUBLIC_AGENT_ID);

    // 3. Make the request
    const rsp = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });

    // 4. Handle API errors
    if (!rsp.ok) {
      const errorText = await rsp.text();
      console.error('ElevenLabs API error:', rsp.status, errorText);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${rsp.status}` },
        { status: rsp.status }
      );
    }

    // 5. Parse and validate response
    const data = await rsp.json();
    if (!data.signed_url) {
      throw new Error('No signed_url in response');
    }

    return NextResponse.json({ signedUrl: data.signed_url });
    
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: 'Failed to get signed URL' },
      { status: 500 }
    );
  }
}