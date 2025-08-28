import React, { useState, useEffect } from 'react'
import { Plus, Minus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'withdrawal_request'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  description: string
  created_at: string
}

interface Client {
  id: string
  full_name: string
  balance: number
}

export default function ClientDashboard() {
  const [client, setClient] = useState<Client | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchClientData()
      fetchTransactions()
    }
  }, [user])

  const fetchClientData = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (data) {
      setClient(data)
    }
    setLoading(false)
  }

  const fetchTransactions = async () => {
    if (!user) return

    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single()

    if (clientData) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      if (data) {
        setTransactions(data)
      }
    }
  }

  const requestWithdrawal = async () => {
    if (!client || !withdrawalAmount) return

    const amount = parseFloat(withdrawalAmount)
    if (amount <= 0 || amount > client.balance) {
      alert('Montant invalide')
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        client_id: client.id,
        type: 'withdrawal_request',
        amount: amount,
        status: 'pending',
        description: `Demande de retrait de ${amount} FCFA`
      })

    if (!error) {
      setShowWithdrawModal(false)
      setWithdrawalAmount('')
      fetchTransactions()
      alert('Demande de retrait envoyée ! Vous recevrez une notification quand elle sera traitée.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente'
      case 'approved':
        return 'Approuvé'
      case 'completed':
        return 'Terminé'
      case 'rejected':
        return 'Rejeté'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!client) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Votre compte n'a pas encore été créé par l'administrateur.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Balance Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Solde disponible</p>
            <p className="text-3xl font-bold text-gray-900">{client.balance.toLocaleString()} FCFA</p>
            <p className="text-sm text-gray-400 mt-1">Bonjour {client.full_name}</p>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Minus className="h-4 w-4" />
              <span>Demander un retrait</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions récentes</h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune transaction</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    {transaction.type === 'deposit' ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <Plus className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-full">
                        <Minus className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <p className="text-sm text-gray-500">{getStatusText(transaction.status)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demande de retrait</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant à retirer
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="0"
                max={client.balance}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solde disponible: {client.balance.toLocaleString()} FCFA
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={requestWithdrawal}
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}