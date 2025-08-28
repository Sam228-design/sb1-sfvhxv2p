import React from 'react'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/LoginForm'
import AdminDashboard from './components/AdminDashboard'
import ClientDashboard from './components/ClientDashboard'

function App() {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return isAdmin() ? <AdminDashboard /> : <ClientDashboard />
}

export default App