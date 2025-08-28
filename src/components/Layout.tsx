import React from 'react'
import { LogOut, Wallet, Users, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { signOut, isAdmin } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
                <nav className="flex space-x-8 ml-12">
                  <button
                    onClick={() => onTabChange?.('clients')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'clients'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Clients</span>
                  </button>
                  <button
                    onClick={() => onTabChange?.('transactions')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'transactions'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Transactions</span>
                  </button>
                </nav>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Mon Portefeuille</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}