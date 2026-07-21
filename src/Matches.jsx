import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Matches({ session, onSelectMatch }) {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    const loadMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*, user1:user1_id(name), user2:user2_id(name)')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)

      setMatches(data || [])
    }
    loadMatches()
  }, [session])

  return (
    <div style={{ padding: 20 }}>
      <h2>Your matches</h2>
      {matches.length === 0 && <p>No matches yet — go swipe!</p>}
      {matches.map((m) => {
        const isUser1 = m.user1_id === session.user.id
        const otherName = isUser1 ? m.user2.name : m.user1.name
        const otherId = isUser1 ? m.user2_id : m.user1_id

        return (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <button onClick={() => onSelectMatch({ matchId: m.id, otherId, otherName })}>
              Chat with {otherName}
            </button>
          </div>
        )
      })}
    </div>
  )
}