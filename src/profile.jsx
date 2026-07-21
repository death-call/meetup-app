import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Profile({ session }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

const shareLocation = () => {
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await supabase.from('profiles').update({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        last_active: new Date().toISOString(),
        is_available: true,
      }).eq('id', session.user.id)
      setIsAvailable(true)
    },
    (err) => alert('Location error: ' + err.message)
  )
}

const goUnavailable = async () => {
  await supabase.from('profiles').update({ is_available: false }).eq('id', session.user.id)
  setIsAvailable(false)
}
  // Load existing profile (if any) when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setName(data.name || '')
        setBio(data.bio || '')
        setInterests((data.interests || []).join(', '))
      }
      setLoading(false)
    }
    loadProfile()
  }, [session])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaved(false)

    const interestsArray = interests
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0)

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name,
      bio,
      interests: interestsArray,
    })

    if (error) alert(error.message)
    else setSaved(true)
  }

  if (loading) return <p>Loading profile...</p>

  return (
    <form onSubmit={handleSave} style={{ padding: 20, maxWidth: 400 }}>
      <h2>Your profile</h2>
      <div>
        <label>Name</label><br />
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <br />
      <div>
        <label>Bio</label><br />
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
      </div>
      <br />
      <div>
        <label>Interests (comma separated)</label><br />
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="hiking, coffee, gaming"
        />
      </div>
      <br />
      <button type="submit">Save profile</button>
      <div style={{ marginBottom: 16 }}>
  {isAvailable ? (
    <button onClick={goUnavailable}>Go unavailable</button>
  ) : (
    <button onClick={shareLocation}>I'm free — find people nearby</button>
  )}
</div>
      {saved && <p>Saved!</p>}
    </form>
  )
}