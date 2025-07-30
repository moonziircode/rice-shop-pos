import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { User, COLLECTIONS } from './firestore'

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'cashier'
  status?: 'active' | 'inactive' | 'suspended'
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  /**
   * Create a new user account
   */
  static async createUser(userData: CreateUserData): Promise<{ user: FirebaseUser; profile: User }> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )
      
      const firebaseUser = userCredential.user
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: userData.name
      })
      
      // Create user profile in Firestore
      const userProfile: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status || 'active',
        createdAt: Timestamp.now().toDate().toISOString(),
        lastActive: Timestamp.now().toDate().toISOString()
      }
      
      const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
      await setDoc(userDocRef, userProfile)
      
      return {
        user: firebaseUser,
        profile: { id: firebaseUser.uid, ...userProfile }
      }
    } catch (error) {
      AuthService.handleAuthError(error as AuthError, 'createUser')
      throw error
    }
  }
  
  /**
   * Sign in user
   */
  static async signIn(signInData: SignInData): Promise<{ user: FirebaseUser; profile: User }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        signInData.email, 
        signInData.password
      )
      
      const firebaseUser = userCredential.user
      
      // Get user profile
      const profile = await AuthService.getUserProfile(firebaseUser.uid)
      if (!profile) {
        throw new Error('User profile not found')
      }
      
      // Check if user is active
      if (profile.status !== 'active') {
        await signOut(auth)
        throw new Error('Your account is inactive. Please contact an administrator.')
      }
      
      // Update last active
      await AuthService.updateLastActive(firebaseUser.uid)
      
      return {
        user: firebaseUser,
        profile: { ...profile, lastActive: new Date().toISOString() }
      }
    } catch (error) {
      AuthService.handleAuthError(error as AuthError, 'signIn')
      throw error
    }
  }
  
  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      AuthService.handleAuthError(error as AuthError, 'signOut')
      throw error
    }
  }
  
  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      AuthService.handleAuthError(error as AuthError, 'resetPassword')
      throw error
    }
  }
  
  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('No authenticated user')
      }
      
      await updatePassword(currentUser, newPassword)
    } catch (error) {
      AuthService.handleAuthError(error as AuthError, 'updatePassword')
      throw error
    }
  }
  
  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        return {
          id: userDocSnap.id,
          ...userDocSnap.data()
        } as User
      }
      
      return null
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }
  
  /**
   * Update last active timestamp
   */
  static async updateLastActive(uid: string): Promise<void> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USERS, uid)
      await setDoc(userDocRef, {
        lastActive: Timestamp.now().toDate().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating last active:', error)
    }
  }
  
  /**
   * Get current authenticated user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser
  }
  
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser
  }
  
  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: AuthError, context: string): void {
    console.error(`Firebase Auth error in ${context}:`, error)
    
    let message = 'An authentication error occurred'
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists'
        break
      case 'auth/invalid-email':
        message = 'Invalid email address'
        break
      case 'auth/operation-not-allowed':
        message = 'Email/password accounts are not enabled'
        break
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters'
        break
      case 'auth/user-disabled':
        message = 'Your account has been disabled'
        break
      case 'auth/user-not-found':
        message = 'No account found with this email'
        break
      case 'auth/wrong-password':
        message = 'Incorrect password'
        break
      case 'auth/invalid-credential':
        message = 'Invalid email or password'
        break
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later'
        break
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection'
        break
      case 'auth/requires-recent-login':
        message = 'Please sign in again to perform this action'
        break
      default:
        message = error.message || 'Authentication failed'
    }
    
    // You could also dispatch to a global error handler or show a toast notification
    throw new Error(message)
  }
}

// Demo user creation utility for development
export const createDemoUsers = async (): Promise<void> => {
  const demoUsers: CreateUserData[] = [
    {
      name: 'Admin User',
      email: 'admin@riceshop.com',
      password: 'admin123',
      role: 'admin',
      status: 'active'
    },
    {
      name: 'Manager User',
      email: 'manager@riceshop.com', 
      password: 'manager123',
      role: 'manager',
      status: 'active'
    },
    {
      name: 'Cashier User',
      email: 'cashier1@riceshop.com',
      password: 'cashier123',
      role: 'cashier',
      status: 'active'
    }
  ]
  
  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingProfile = await AuthService.getUserProfile(userData.email)
      if (!existingProfile) {
        await AuthService.createUser(userData)
        console.log(`✅ Demo user created: ${userData.email}`)
      } else {
        console.log(`ℹ️ Demo user already exists: ${userData.email}`)
      }
    } catch (error: any) {
      if (error.code !== 'auth/email-already-in-use') {
        console.error(`❌ Failed to create demo user ${userData.email}:`, error.message)
      } else {
        console.log(`ℹ️ Demo user already exists: ${userData.email}`)
      }
    }
  }
}

// Export auth utilities
export const FirebaseAuth = {
  createUser: AuthService.createUser,
  signIn: AuthService.signIn,
  signOut: AuthService.signOut,
  resetPassword: AuthService.resetPassword,
  updatePassword: AuthService.updatePassword,
  getUserProfile: AuthService.getUserProfile,
  getCurrentUser: AuthService.getCurrentUser,
  isAuthenticated: AuthService.isAuthenticated,
  createDemoUsers
}

console.log('🔥 Firebase Auth services initialized')