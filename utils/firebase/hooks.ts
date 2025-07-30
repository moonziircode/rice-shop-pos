import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  where, 
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth, db } from './config'
import { User, Product, Transaction } from './firestore'

// Custom hook for authentication state
export const useAuthState = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}

// Custom hook for real-time Firestore collection
export const useFirestoreCollection = <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const collectionRef = collection(db, collectionName)
      const q = query(collectionRef, ...constraints)
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as T))
          
          setData(items)
          setLoading(false)
          setError(null)
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [collectionName, JSON.stringify(constraints)])

  return { data, loading, error }
}

// Custom hook for users collection
export const useUsers = () => {
  return useFirestoreCollection<User>('users', [orderBy('createdAt', 'desc')])
}

// Custom hook for products collection
export const useProducts = (category?: Product['category']) => {
  const constraints = category 
    ? [where('category', '==', category), orderBy('createdAt', 'desc')]
    : [orderBy('createdAt', 'desc')]
    
  return useFirestoreCollection<Product>('products', constraints)
}

// Custom hook for transactions collection
export const useTransactions = (limitCount?: number, cashierId?: string) => {
  const constraints: QueryConstraint[] = []
  
  if (cashierId) {
    constraints.push(where('cashierId', '==', cashierId))
  }
  
  constraints.push(orderBy('timestamp', 'desc'))
  
  if (limitCount) {
    constraints.push(limit(limitCount))
  }
  
  return useFirestoreCollection<Transaction>('transactions', constraints)
}

// Custom hook for recent transactions
export const useRecentTransactions = (limitCount: number = 10) => {
  return useTransactions(limitCount)
}

// Custom hook for user's own transactions (for cashiers)
export const useMyTransactions = () => {
  const { user } = useAuthState()
  return useTransactions(undefined, user?.uid)
}

// Custom hook for low stock products
export const useLowStockProducts = (threshold: number = 10) => {
  return useFirestoreCollection<Product>('products', [
    where('stock', '<=', threshold),
    orderBy('stock', 'asc')
  ])
}

// Custom hook for products by category with real-time updates
export const useProductsByCategory = (category: Product['category']) => {
  return useFirestoreCollection<Product>('products', [
    where('category', '==', category),
    orderBy('name', 'asc')
  ])
}

// Custom hook for transactions within date range
export const useTransactionsByDateRange = (startDate: string, endDate: string) => {
  return useFirestoreCollection<Transaction>('transactions', [
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc')
  ])
}

// Custom hook for today's transactions
export const useTodaysTransactions = () => {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
  
  return useTransactionsByDateRange(startOfDay, endOfDay)
}

// Custom hook for real-time analytics data
export const useAnalytics = () => {
  const { data: transactions, loading: transactionsLoading } = useTransactions()
  const { data: products, loading: productsLoading } = useProducts()
  const { data: users, loading: usersLoading } = useUsers()

  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalUsers: 0,
    salesByMonth: [] as { month: string; sales: number }[],
    topProducts: [] as { name: string; sales: number }[],
    recentTransactions: [] as Transaction[]
  })

  const loading = transactionsLoading || productsLoading || usersLoading

  useEffect(() => {
    if (!loading) {
      // Calculate total sales
      const totalSales = transactions.reduce((sum, t) => sum + t.total, 0)
      
      // Calculate sales by month
      const salesByMonth: { [key: string]: number } = {}
      transactions.forEach(transaction => {
        const date = new Date(transaction.timestamp)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + transaction.total
      })

      // Calculate top products
      const productSales: { [key: string]: number } = {}
      transactions.forEach(transaction => {
        transaction.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + (item.quantity * item.price)
        })
      })

      const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      setAnalytics({
        totalSales,
        totalTransactions: transactions.length,
        totalProducts: products.length,
        totalUsers: users.length,
        salesByMonth: Object.entries(salesByMonth).map(([month, sales]) => ({ month, sales })),
        topProducts,
        recentTransactions: transactions.slice(0, 5)
      })
    }
  }, [transactions, products, users, loading])

  return { analytics, loading }
}

export default {
  useAuthState,
  useFirestoreCollection,
  useUsers,
  useProducts,
  useTransactions,
  useRecentTransactions,
  useMyTransactions,
  useLowStockProducts,
  useProductsByCategory,
  useTransactionsByDateRange,
  useTodaysTransactions,
  useAnalytics
}