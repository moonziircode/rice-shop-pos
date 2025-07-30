import React, { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { projectId } from '../utils/supabase/info'
import { ShoppingCart, Search, Filter, Eye, Calendar, User, CreditCard } from 'lucide-react'

const TransactionManagement = () => {
  const { accessToken } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [cashierFilter, setCashierFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'digital', label: 'Digital Payment' }
  ]

  useEffect(() => {
    fetchTransactions()
    fetchUsers()
  }, [accessToken])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8108af16/transactions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      } else {
        console.log('Failed to fetch transactions')
      }
    } catch (error) {
      console.log('Fetch transactions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8108af16/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.log('Fetch users error:', error)
    }
  }

  const getCashierName = (cashierId) => {
    const cashier = users.find(u => u.id === cashierId)
    return cashier ? cashier.name : 'Unknown Cashier'
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Search filter
      const matchesSearch = transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getCashierName(transaction.cashierId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.items?.some(item => 
                             item.name.toLowerCase().includes(searchTerm.toLowerCase())
                           )

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all') {
        const transactionDate = new Date(transaction.timestamp)
        const today = new Date()
        
        switch (dateFilter) {
          case 'today':
            matchesDate = transactionDate.toDateString() === today.toDateString()
            break
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = transactionDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = transactionDate >= monthAgo
            break
        }
      }

      // Cashier filter
      const matchesCashier = cashierFilter === 'all' || transaction.cashierId === cashierFilter

      // Payment method filter
      const matchesPayment = paymentFilter === 'all' || transaction.paymentMethod === paymentFilter

      return matchesSearch && matchesDate && matchesCashier && matchesPayment
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  const openDetailModal = (transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const filteredTransactions = getFilteredTransactions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">View and manage all rice shop transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select
            value={cashierFilter}
            onChange={(e) => setCashierFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Cashiers</option>
            {users
              .filter(user => user.role === 'cashier' || user.role === 'manager' || user.role === 'admin')
              .map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredTransactions.length} transactions</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{transaction.id}</h3>
                  <p className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-medium text-green-600 text-lg">
                  ${transaction.total.toFixed(2)}
                </span>
                <button
                  onClick={() => openDetailModal(transaction)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Cashier:</span>
                <span className="text-gray-900">{getCashierName(transaction.cashierId)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Payment:</span>
                <span className="text-gray-900 capitalize">{transaction.paymentMethod}</span>
              </div>

              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Items:</span>
                <span className="text-gray-900">{transaction.items?.length || 0}</span>
              </div>
            </div>

            {transaction.items && transaction.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Items:</div>
                <div className="flex flex-wrap gap-2">
                  {transaction.items.slice(0, 3).map((item, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                  {transaction.items.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">
                      +{transaction.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {transactions.length === 0 
              ? 'No transactions have been recorded yet.' 
              : 'No transactions match your search criteria.'}
          </p>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cashier</label>
                  <p className="mt-1 text-sm text-gray-900">{getCashierName(selectedTransaction.cashierId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.paymentMethod}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Items Purchased</label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.price}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${selectedTransaction.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionManagement