'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useRef } from 'react';

export function Conversation() {
  const idRef = useRef('');               // conversationId из startSession()

  const conversation = useConversation({
    onDisconnect: async () => {
      const id = idRef.current;
      if (!id) return;

      await fetch('/api/persist-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      });

      idRef.current = '';                 // очищаем ТОЛЬКО после успешного POST
      console.log('socket disconnected & persisted');
    },
  });

  const getSignedUrl = async () => {
    const r = await fetch('/api/signed-url', { method: 'POST' });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()).signedUrl as string;
  };

  const startConversation = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const signedUrl = await getSignedUrl();

    idRef.current = await conversation.startSession({ signedUrl });
    console.log('started, id:', idRef.current);
  }, [conversation]);

  const stopConversation = () => conversation.endSession();

  return (
    <div className="flex flex-col gap-3">
      <button onClick={startConversation}>Start</button>
      <button onClick={stopConversation}>Stop</button>
      <p>ID: {idRef.current}</p>
      <p>Status: {conversation.status}</p>
    </div>
  );
}
