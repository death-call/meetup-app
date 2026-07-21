import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 40, maxWidth: 300 }}>
      <h2>{isSignUp ? 'Sign up' : 'Sign in'}</h2>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br /><br />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      /><br /><br />
      <button type="submit">{isSignUp ? 'Sign up' : 'Sign in'}</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Sign in instead' : 'Sign up instead'}
        </button>
      </p>
    </form>
  )
}