import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function Chat({ session, match, onBack }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.matchId)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }
    loadMessages()

    // Subscribe to new messages in real time
    const channel = supabase
      .channel(`messages:${match.matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${match.matchId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await supabase.from('messages').insert({
      match_id: match.matchId,
      sender_id: session.user.id,
      content: newMessage,
    })
    setNewMessage('')
  }

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <button onClick={onBack}>← Back</button>
      <h2>Chat with {match.otherName}</h2>
      <div style={{ height: 300, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
        {messages.map((m) => (
          <p key={m.id} style={{ textAlign: m.sender_id === session.user.id ? 'right' : 'left' }}>
            {m.content}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ width: '80%' }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}