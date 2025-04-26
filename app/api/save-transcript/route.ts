import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();

  if (!transcript) {
    console.log('No transcript provided');
    return NextResponse.json(
      { error: 'No transcript provided' },
      { status: 400 },
    );
  }

  try {
    // 1) создаём документ в Knowledge Base
    const createRes = await fetch(
      'https://api.elevenlabs.io/v1/convai/knowledge-base/text',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcript,
          name: `Conversation ${new Date()
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ')}`,
        }),
      },
    );

    if (!createRes.ok) {
      throw new Error(
        `KB create failed: ${createRes.status} ${await createRes.text()}`,
      );
    }

    const { id: documentId } = await createRes.json();

    // 2) привязываем документ к агенту
    const patchRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${process.env.AGENT_ID}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          knowledge_base: [
            { id: documentId, type: 'text', usage_mode: 'auto' },
          ],
        }),
      },
    );

    if (!patchRes.ok) {
      throw new Error(
        `Agent patch failed: ${patchRes.status} ${await patchRes.text()}`,
      );
    }

    return NextResponse.json({ ok: true, documentId });
  } catch (e: any) {
    console.error('save-transcript error', e);
    return NextResponse.json(
      { error: 'Failed to save transcript' },
      { status: 500 },
    );
  }
}
