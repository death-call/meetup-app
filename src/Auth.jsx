import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else setSent(true)
  }

  if (sent) return <p>Check your email for the login link!</p>

  return (
    <form onSubmit={handleLogin} style={{ padding: 40 }}>
      <h2>Sign in</h2>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Send magic link</button>
    </form>
  )
}