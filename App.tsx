import React, { useState, useEffect, createContext, useContext } from 'react'
import { auth, db } from './utils/firebase/config'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import UserManagement from './components/UserManagement'
import ProductManagement from './components/ProductManagement'
import TransactionManagement from './components/TransactionManagement'
import Sidebar from './components/Sidebar'
import { User, Coffee, Users, ShoppingCart, BarChart3, LogOut } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastActive?: string
}

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: UserProfile | null
  signIn: (email: string, password: string) => Promise<{ user?: FirebaseUser; error?: string }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          
          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile
            setUserProfile(profileData)
          } else {
            // If no profile exists, create a default one or handle error
            console.warn('User profile not found in Firestore')
            setUserProfile(null)
          }
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Fetch user profile
      const userDocRef = doc(db, 'users', firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const profileData = userDocSnap.data() as UserProfile
        setUserProfile(profileData)
        
        // Check if user is active
        if (profileData.status !== 'active') {
          await firebaseSignOut(auth)
          return { error: 'Your account is inactive. Please contact an administrator.' }
        }
      } else {
        await firebaseSignOut(auth)
        return { error: 'User profile not found. Please contact an administrator.' }
      }

      return { user: firebaseUser }
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      // Handle specific Firebase auth errors
      let errorMessage = 'An error occurred during sign in'
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address'
          break
        case 'auth/user-disabled':
          errorMessage = 'Your account has been disabled'
          break
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password'
          break
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later'
          break
        default:
          errorMessage = error.message || 'Sign in failed'
      }
      
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    signIn,
    signOut,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  return (
    <AuthProvider>
      <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </AuthProvider>
  )
}

interface AppContentProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const AppContent: React.FC<AppContentProps> = ({ currentPage, setCurrentPage }) => {
  const { user, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return <LoginPage />
  }

  // Check if user has admin or manager role
  const hasAdminAccess = userProfile.role === 'admin' || userProfile.role === 'manager'

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: BarChart3 },
    { name: 'Products', id: 'products', icon: Coffee },
    { name: 'Transactions', id: 'transactions', icon: ShoppingCart },
    ...(hasAdminAccess ? [{ name: 'Users', id: 'users', icon: Users }] : [])
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'users':
        return hasAdminAccess ? <UserManagement /> : <Dashboard />
      case 'products':
        return <ProductManagement />
      case 'transactions':
        return <TransactionManagement />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        navigation={navigation}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userProfile={userProfile}
      />
      <main className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App