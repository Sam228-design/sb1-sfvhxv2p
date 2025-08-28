import React, { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Layout from './Layout'
import { v4 as uuidv4 } from 'uuid'

interface Client {
  id: string
  email: string
  full_name: string
  phone: string
  balance: number
  status: 'active' | 'suspended'
  created_at: string
}

interface Transaction {
  id: string
  client_id: string
  type: 'deposit' | 'withdrawal' | 'withdrawal_request'
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  description: string
  created_at: string
  client?: { full_name: string }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('clients')
  const [clients, setClients] = useState<Client[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: ''
  })

  useEffect(() => {
    fetchClients()
    fetchTransactions()
  }, [])

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setClients(data)
    }
  }

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        client:clients(full_name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
    }
  }

  const createClient = async () => {
    if (!formData.email || !formData.full_name || !formData.phone || !formData.password) {
      alert('Veuillez remplir tous les champs')
      return
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true
    })

    if (authError) {
      alert('Erreur lors de la création du compte: ' + authError.message)
      return
    }

    // Create client record
    const { error } = await supabase
      .from('clients')
      .insert({
        id: authData.user?.id || uuidv4(),
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        balance: 0
      })

    if (!error) {
      setShowCreateModal(false)
      setFormData({ email: '', full_name: '', phone: '', password: '' })
      fetchClients()
    }
  }

  const addDeposit = async () => {
    if (!selectedClient || !depositAmount) return

    const amount = parseFloat(depositAmount)
    if (amount <= 0) {
      alert('Montant invalide')
      return
    }

    // Add transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        client_id: selectedClient.id,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: `Dépôt de ${amount} FCFA`
      })

    // Update client balance
    const { error: balanceError } = await supabase
      .from('clients')
      .update({
        balance: selectedClient.balance + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedClient.id)

    if (!transactionError && !balanceError) {
      setShowDepositModal(false)
      setDepositAmount('')
      setSelectedClient(null)
      fetchClients()
      fetchTransactions()
    }
  }

  const processWithdrawal = async (transaction: Transaction, approve: boolean) => {
    const status = approve ? 'approved' : 'rejected'
    
    // Update transaction status
    const { error: transactionError } = await supabase
      .from('transactions')
      .update({
        status: status,
        processed_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // If approved, update client balance
    if (approve) {
      const client = clients.find(c => c.id === transaction.client_id)
      if (client) {
        const { error: balanceError } = await supabase
          .from('clients')
          .update({
            balance: client.balance - transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id)

        if (balanceError) {
          alert('Erreur lors de la mise à jour du solde')
          return
        }
      }
    }

    if (!transactionError) {
      fetchClients()
      fetchTransactions()
    }
  }

  const pendingWithdrawals = transactions.filter(t => 
    t.type === 'withdrawal_request' && t.status === 'pending'
  )

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Client</span>
            </button>
          </div>

          {/* Pending Withdrawals Alert */}
          {pendingWithdrawals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>{pendingWithdrawals.length}</strong> demande(s) de retrait en attente de traitement
              </p>
            </div>
          )}

          {/* Clients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.full_name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {client.balance.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedClient(client)
                          setShowDepositModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Ajouter des fonds
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Transactions</h2>
          
          {/* Pending Withdrawals */}
          {pendingWithdrawals.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Demandes de retrait en attente ({pendingWithdrawals.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingWithdrawals.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.client?.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Demande de retrait de {transaction.amount.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => processWithdrawal(transaction, true)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approuver</span>
                      </button>
                      <button
                        onClick={() => processWithdrawal(transaction, false)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Transactions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.client?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'deposit' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'withdrawal_request'
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'deposit' 
                          ? 'Dépôt' 
                          : transaction.type === 'withdrawal_request'
                          ? 'Demande de retrait'
                          : 'Retrait'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'completed' || transaction.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status === 'pending' ? 'En attente' :
                         transaction.status === 'approved' ? 'Approuvé' :
                         transaction.status === 'completed' ? 'Terminé' :
                         'Rejeté'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouveau client</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe temporaire</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createClient}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ajouter des fonds - {selectedClient.full_name}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant à ajouter (FCFA)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solde actuel: {selectedClient.balance.toLocaleString()} FCFA
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setSelectedClient(null)
                  setDepositAmount('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={addDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}