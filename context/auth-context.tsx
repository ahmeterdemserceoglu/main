"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { setUserOnline, setUserOffline } from "@/lib/user-status"

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  // E-posta ve şifre ile giriş yapma fonksiyonu
  const signIn = async (email: string, password: string) => {
    try {
      await firebaseSignInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Giriş hatası:", error)
      throw error
    }
  }

  // Google ile giriş yapma fonksiyonu
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Google ile giriş hatası:", error)
      throw error
    }
  }

  // Çıkış yapma fonksiyonu
  const signOut = async () => {
    try {
      if (user) {
        await setUserOffline(user.uid)
      }
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Çıkış hatası:", error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Kullanıcı bilgilerini Firestore'da güncelle
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          // Kullanıcı zaten var, son giriş zamanını güncelle
          await setDoc(
            userRef,
            {
              lastLogin: serverTimestamp(),
            },
            { merge: true },
          )
        } else {
          // Yeni kullanıcı oluştur
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            role: "user",
          })
        }

        // Kullanıcı durumunu çevrimiçi olarak ayarla
        await setUserOnline(firebaseUser.uid)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Sayfa kapatıldığında kullanıcı durumunu çevrimdışı olarak ayarla
    const handleBeforeUnload = async () => {
      if (user) {
        await setUserOffline(user.uid)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      unsubscribe()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>
  )
}
