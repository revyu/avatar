import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { conversationId } = await req.json();
  if (!conversationId)
    return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const api = 'https://api.elevenlabs.io/v1/convai';
  const key = process.env.ELEVENLABS_API_KEY!;
  let attempt = 0;
  let convo, status = 'processing';

  /* 1. Ждём, пока статус разговора станет done или пока появится текст */
  while (attempt < 8 && status !== 'done') {
    convo = await fetch(`${api}/conversations/${conversationId}`, {
      headers: { 'xi-api-key': key },
    }).then(r => r.json());

    status = convo.status;                       // 'in-progress' | 'processing' | 'done'
    if (convo.transcript?.length) break;         // иногда текст готов даже при 'processing'

    attempt += 1;
    await new Promise(r => setTimeout(r, 1000)); // 1-сек. пауза
  }

  const raw = (convo?.transcript || [])
    .map((l: any) => `${l.role}: ${l.message}`)
    .join('\n')
    .trim();

  if (!raw)
    return NextResponse.json({ error: 'empty transcript' }, { status: 502 });

  /* 2. Документ KB с понятным заголовком */
  const label = new Date().toLocaleString('ru-RU', { hour12: false });
  const kbRes = await fetch(`${api}/knowledge-base/text`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `### Разговор от ${label}\n\n${raw}`,
      name: `Разговор от ${label}`,
    }),
  }).then(r => r.json());

  /* 3. Привязка к агенту */
  await fetch(`${api}/agents/${process.env.AGENT_ID}`, {
    method: 'PATCH',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rag_enabled: true,
      knowledge_base: [{ id: kbRes.id, type: 'text', usage_mode: 'auto' }],
    }),
  });

  return NextResponse.json({ ok: true, documentId: kbRes.id });
}
