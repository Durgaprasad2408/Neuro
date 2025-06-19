import { useState, useEffect } from 'react'
import { auth } from './lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import Auth from './components/Auth'
import Journal from './components/Journal'
import PasswordChange from './components/PasswordChange'
import EditProfile from './components/EditProfile'
import ChangeEmail from './components/ChangeEmail'
import './App.css'
import { Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false)
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const closeAllModals = () => {
    setIsPasswordChangeOpen(false)
    setIsEditProfileOpen(false)
    setIsChangeEmailOpen(false)
    setIsSettingsDropdownOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-850 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-850 transition-colors duration-200">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            NeuroEase
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <ChevronDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              
              {isSettingsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsEditProfileOpen(true)
                        setIsSettingsDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsChangeEmailOpen(true)
                        setIsSettingsDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Change Email
                    </button>
                    <button
                      onClick={() => {
                        setIsPasswordChangeOpen(true)
                        setIsSettingsDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-8">
        <Journal user={user} />
      </main>
      
      {/* Modals */}
      <PasswordChange 
        isOpen={isPasswordChangeOpen}
        onClose={() => setIsPasswordChangeOpen(false)}
      />
      <EditProfile 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
      />
      <ChangeEmail 
        isOpen={isChangeEmailOpen}
        onClose={() => setIsChangeEmailOpen(false)}
        user={user}
      />
      
      {/* Backdrop to close dropdown */}
      {isSettingsDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSettingsDropdownOpen(false)}
        />
      )}
    </div>
  )
}

export default App