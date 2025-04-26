'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';

export function Conversation() {
  const [convId, setConvId] = useState<string>('');

  const conversation = useConversation({
    onConnect: () => console.log('socket connected'),
    onDisconnect: async () => {
      if (!convId) return;
      // let the server fetch transcript & push to KB
      await fetch('/api/persist-conversation', {
        method: 'POST',
        body: JSON.stringify({ conversationId: convId }),
      });
      setConvId('');
      console.log('socket disconnected');
    },
  });

  const startConversation = useCallback(async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const res = await fetch('/api/signed-url', { method: 'POST' });
    const { signedUrl } = await res.json();
    const id = await conversation.startSession({ signedUrl }); // returns conv-id
    setConvId(id);
  }, [conversation]);

  const stopConversation = () => conversation.endSession();

  return (
    <div className="flex flex-col gap-3">
      <button onClick={startConversation}>Start</button>
      <button onClick={stopConversation}>Stop</button>
      <p>ID: {convId}</p>
      <p>Status: {conversation.status}</p>
    </div>
  );
}
