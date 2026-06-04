const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setError(error.message)
    setLoading(false)
    return
  }

  if (data.session) {
    window.location.replace('/dashboard')
    return
  }

  setError('Login failed. Please try again.')
  setLoading(false)
}
