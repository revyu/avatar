import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json();
  if (!conversationId) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const api = 'https://api.elevenlabs.io/v1/convai';
  const key = process.env.ELEVENLABS_API_KEY!;

  /* 1. pull finished transcript */
  const convoRes = await fetch(`${api}/conversations/${conversationId}`, {
    headers: { 'xi-api-key': key },
  });
  const convo = await convoRes.json();
  const text = convo.transcript
    .map((m: any) => `${m.role}: ${m.message}`)
    .join('\n');

  /* 2. create KB doc */
  const kbRes = await fetch(`${api}/knowledge-base/text`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, name: `Call ${conversationId}` }),
  });
  const { id: documentId } = await kbRes.json();

  /* 3. attach to agent */
  await fetch(`${api}/agents/${process.env.AGENT_ID}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      knowledge_base: [{ id: documentId, type: 'text', usage_mode: 'auto' }],
    }),
  });

  return NextResponse.json({ ok: true, documentId });
}
