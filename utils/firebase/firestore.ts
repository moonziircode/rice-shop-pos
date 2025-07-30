import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore'
import { db, getCurrentUser } from './config'

// Types
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastActive?: string
}

export interface Product {
  id: string
  name: string
  category: 'kiloan' | 'karungan' | 'liter'
  unit: string
  price: number
  stock: number
  description?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface TransactionItem {
  productId: string
  name: string
  quantity: number
  price: number
  unit: string
}

export interface Transaction {
  id: string
  cashierId: string
  cashierName: string
  items: TransactionItem[]
  total: number
  paymentMethod: 'cash' | 'card' | 'digital'
  timestamp: string
  status: 'completed' | 'cancelled' | 'refunded'
}

export interface Analytics {
  totalSales: number
  totalTransactions: number
  totalProducts: number
  totalUsers: number
  salesByMonth: { month: string; sales: number }[]
  topProducts: { name: string; sales: number }[]
  recentTransactions: Transaction[]
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  ANALYTICS: 'analytics'
} as const

// Error handling helper
const handleFirestoreError = (error: any, context: string) => {
  console.error(`Firestore error in ${context}:`, error)
  
  if (error.code === 'permission-denied') {
    throw new Error('Permission denied. Please check your access rights.')
  }
  
  if (error.code === 'not-found') {
    throw new Error('Resource not found.')
  }
  
  if (error.code === 'already-exists') {
    throw new Error('Resource already exists.')
  }
  
  throw new Error(`Database error: ${error.message || 'Unknown error'}`)
}

// Users Service
export class UsersService {
  private static collection = collection(db, COLLECTIONS.USERS)

  static async getAll(): Promise<User[]> {
    try {
      const snapshot = await getDocs(query(this.collection, orderBy('createdAt', 'desc')))
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
    } catch (error) {
      handleFirestoreError(error, 'getUsers')
      return []
    }
  }

  static async getById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as User
      }
      
      return null
    } catch (error) {
      handleFirestoreError(error, 'getUserById')
      return null
    }
  }

  static async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const docRef = await addDoc(this.collection, {
        ...userData,
        createdAt: Timestamp.now().toDate().toISOString(),
        lastActive: Timestamp.now().toDate().toISOString()
      })
      
      return docRef.id
    } catch (error) {
      handleFirestoreError(error, 'createUser')
      throw error
    }
  }

  static async update(id: string, userData: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id)
      await updateDoc(docRef, {
        ...userData,
        lastActive: Timestamp.now().toDate().toISOString()
      })
    } catch (error) {
      handleFirestoreError(error, 'updateUser')
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, id)
      await deleteDoc(docRef)
    } catch (error) {
      handleFirestoreError(error, 'deleteUser')
    }
  }
}

// Products Service
export class ProductsService {
  private static collection = collection(db, COLLECTIONS.PRODUCTS)

  static async getAll(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(query(this.collection, orderBy('createdAt', 'desc')))
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product))
    } catch (error) {
      handleFirestoreError(error, 'getProducts')
      return []
    }
  }

  static async getById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Product
      }
      
      return null
    } catch (error) {
      handleFirestoreError(error, 'getProductById')
      return null
    }
  }

  static async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const docRef = await addDoc(this.collection, {
        ...productData,
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
        createdBy: currentUser.uid
      })
      
      return docRef.id
    } catch (error) {
      handleFirestoreError(error, 'createProduct')
      throw error
    }
  }

  static async update(id: string, productData: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
      await updateDoc(docRef, {
        ...productData,
        updatedAt: Timestamp.now().toDate().toISOString()
      })
    } catch (error) {
      handleFirestoreError(error, 'updateProduct')
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id)
      await deleteDoc(docRef)
    } catch (error) {
      handleFirestoreError(error, 'deleteProduct')
    }
  }

  static async getByCategory(category: Product['category']): Promise<Product[]> {
    try {
      const q = query(this.collection, where('category', '==', category))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product))
    } catch (error) {
      handleFirestoreError(error, 'getProductsByCategory')
      return []
    }
  }
}

// Transactions Service
export class TransactionsService {
  private static collection = collection(db, COLLECTIONS.TRANSACTIONS)

  static async getAll(): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(query(this.collection, orderBy('timestamp', 'desc')))
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction))
    } catch (error) {
      handleFirestoreError(error, 'getTransactions')
      return []
    }
  }

  static async getById(id: string): Promise<Transaction | null> {
    try {
      const docRef = doc(db, COLLECTIONS.TRANSACTIONS, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Transaction
      }
      
      return null
    } catch (error) {
      handleFirestoreError(error, 'getTransactionById')
      return null
    }
  }

  static async create(transactionData: Omit<Transaction, 'id' | 'timestamp'>): Promise<string> {
    try {
      const currentUser = getCurrentUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const docRef = await addDoc(this.collection, {
        ...transactionData,
        timestamp: Timestamp.now().toDate().toISOString(),
        status: 'completed'
      })
      
      return docRef.id
    } catch (error) {
      handleFirestoreError(error, 'createTransaction')
      throw error
    }
  }

  static async getByCashier(cashierId: string): Promise<Transaction[]> {
    try {
      const q = query(this.collection, where('cashierId', '==', cashierId), orderBy('timestamp', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction))
    } catch (error) {
      handleFirestoreError(error, 'getTransactionsByCashier')
      return []
    }
  }

  static async getRecent(limitCount: number = 10): Promise<Transaction[]> {
    try {
      const q = query(this.collection, orderBy('timestamp', 'desc'), limit(limitCount))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction))
    } catch (error) {
      handleFirestoreError(error, 'getRecentTransactions')
      return []
    }
  }
}

// Analytics Service
export class AnalyticsService {
  static async getSalesAnalytics(): Promise<Analytics> {
    try {
      const [transactions, products, users] = await Promise.all([
        TransactionsService.getAll(),
        ProductsService.getAll(),
        UsersService.getAll()
      ])

      const totalSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0)
      const totalTransactions = transactions.length
      const totalProducts = products.length
      const totalUsers = users.length

      // Calculate sales by month
      const salesByMonth = this.calculateSalesByMonth(transactions)
      
      // Calculate top products
      const topProducts = this.calculateTopProducts(transactions)
      
      // Get recent transactions
      const recentTransactions = transactions.slice(0, 5)

      return {
        totalSales,
        totalTransactions,
        totalProducts,
        totalUsers,
        salesByMonth,
        topProducts,
        recentTransactions
      }
    } catch (error) {
      handleFirestoreError(error, 'getSalesAnalytics')
      return {
        totalSales: 0,
        totalTransactions: 0,
        totalProducts: 0,
        totalUsers: 0,
        salesByMonth: [],
        topProducts: [],
        recentTransactions: []
      }
    }
  }

  private static calculateSalesByMonth(transactions: Transaction[]): { month: string; sales: number }[] {
    const salesByMonth: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + transaction.total
    })

    return Object.entries(salesByMonth)
      .map(([month, sales]) => ({ month, sales }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private static calculateTopProducts(transactions: Transaction[]): { name: string; sales: number }[] {
    const productSales: { [key: string]: number } = {}
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + (item.quantity * item.price)
      })
    })

    return Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  }
}

// Export all services
export const FirestoreServices = {
  users: UsersService,
  products: ProductsService,
  transactions: TransactionsService,
  analytics: AnalyticsService
}

console.log('🔥 Firestore services initialized')