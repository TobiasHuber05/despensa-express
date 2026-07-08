'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.usuario) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
      }
      router.push('/')
      router.refresh()
    } else {
      setError('PIN incorrecto')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs bg-white/95 backdrop-blur-md border border-gray-200/50 p-6 rounded-2xl shadow-xl flex flex-col">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Despensa Express</h1>
        <p className="text-xs font-semibold text-gray-500 mb-6 text-center">Ingresá el PIN para continuar</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg px-3 py-3 mb-3 text-gray-900 bg-white"
          autoFocus
        />
        {error && <p className="text-sm text-red-500 text-center mb-3 font-semibold">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-bold active:scale-95 transition shadow-md"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
