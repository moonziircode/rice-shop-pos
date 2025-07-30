// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id" // Optional
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Development mode configuration
const isDevelopment = process.env.NODE_ENV === 'development'

// Connect to emulators in development
if (isDevelopment && !auth.config.emulator) {
  try {
    // Connect to Firebase emulators if running locally
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    
    console.log('🔧 Connected to Firebase emulators')
  } catch (error) {
    console.log('⚠️ Firebase emulators not available, using production')
  }
}

// Export the Firebase app instance
export default app

// Helper function to get current user
export const getCurrentUser = () => {
  return auth.currentUser
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser
}

console.log('🔥 Firebase initialized successfully')