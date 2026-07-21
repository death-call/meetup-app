import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Swipe({ session }) {
  const [profiles, setProfiles] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfiles = async () => {
      // Get ids I've already swiped on
      const { data: mySwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', session.user.id)

      const swipedIds = (mySwipes || []).map((s) => s.swiped_id)

      // Get everyone except me and everyone I've already swiped on
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id)

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data, error } = await query
      if (data) setProfiles(data)
      setLoading(false)
    }
    loadProfiles()
  }, [session])

  const handleSwipe = async (liked) => {
    const swipedProfile = profiles[index]

    // Record my swipe
    await supabase.from('swipes').insert({
      swiper_id: session.user.id,
      swiped_id: swipedProfile.id,
      liked,
    })

    if (liked) {
      // Check if they already liked me
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', swipedProfile.id)
        .eq('swiped_id', session.user.id)
        .eq('liked', true)
        .maybeSingle()

      if (theirSwipe) {
        // It's a match! Create a row, ordering ids consistently
        const [user1_id, user2_id] = [session.user.id, swipedProfile.id].sort()
        await supabase.from('matches').insert({ user1_id, user2_id })
        alert(`It's a match with ${swipedProfile.name}!`)
      }
    }

    setIndex((i) => i + 1)
  }

  if (loading) return <p>Loading profiles...</p>
  if (index >= profiles.length) return <p>No more profiles to show.</p>

  const current = profiles[index]

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h2>{current.name}</h2>
      <p>{current.bio}</p>
      <p>{(current.interests || []).join(', ')}</p>
      <button onClick={() => handleSwipe(false)}>Pass</button>{' '}
      <button onClick={() => handleSwipe(true)}>Like</button>
    </div>
  )
}