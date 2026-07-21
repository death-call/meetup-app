import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Haversine formula: distance in km between two lat/lng points
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function Nearby({ session, onOpenChat }) {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNearby = async () => {
      const { data: me } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', session.user.id)
        .single()

      if (!me?.latitude) {
        setLoading(false)
        return
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id)
        .not('latitude', 'is', null)
        .or(`is_available.eq.true,last_active.gte.${oneHourAgo}`)

      const withDistance = (data || [])
        .map((p) => ({
          ...p,
          distance: getDistanceKm(me.latitude, me.longitude, p.latitude, p.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)

      setPeople(withDistance)
      setLoading(false)
    }
    loadNearby()
  }, [session])

  const openChat = async (otherId, otherName) => {
    const [user1_id, user2_id] = [session.user.id, otherId].sort()

    // Reuse existing match row if it exists, otherwise create one
    let { data: existing } = await supabase
      .from('matches')
      .select('*')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .maybeSingle()

    if (!existing) {
      const { data: created } = await supabase
        .from('matches')
        .insert({ user1_id, user2_id })
        .select()
        .single()
      existing = created
    }

    onOpenChat({ matchId: existing.id, otherId, otherName })
  }

  if (loading) return <p>Loading nearby people...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>Nearby & free right now</h2>
      {people.length === 0 && <p>No one nearby right now. Try again later!</p>}
      {people.map((p) => (
        <div key={p.id} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
          <strong>{p.name}</strong> — {p.distance.toFixed(1)} km away
          <p style={{ margin: '4px 0' }}>{p.bio}</p>
          <button onClick={() => openChat(p.id, p.name)}>Chat</button>
        </div>
      ))}
    </div>
  )
}