import { useState } from 'react'
import { auth } from '../lib/firebase'
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail } from 'firebase/auth'

export default function ChangeEmail({ isOpen, onClose, user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!currentPassword || !newEmail) {
      setError('Please fill in all fields')
      return
    }

    if (!user || !user.email) {
      setError('User information not available')
      return
    }

    try {
      setError(null)
      setLoading(true)
      
      // Create credential with the user's current email and password
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      
      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential)
      
      // Try to send verification email to new address first
      try {
        await verifyBeforeUpdateEmail(user, newEmail)
        setVerificationSent(true)
        setCurrentPassword('')
        setNewEmail('')
        
        // Close modal after showing verification message
        setTimeout(() => {
          onClose()
          setVerificationSent(false)
        }, 5000)
        
      } catch (verifyError) {
        // If verification method fails, fall back to direct update
        if (verifyError.code === 'auth/operation-not-allowed') {
          // This means the Firebase project doesn't support verification before update
          // Try direct update as fallback
          await updateEmail(user, newEmail)
          setSuccess(true)
          setCurrentPassword('')
          setNewEmail('')
          
          // Close modal after showing success message
          setTimeout(() => {
            onClose()
            setSuccess(false)
          }, 2000)
        } else {
          throw verifyError
        }
      }
      
    } catch (error) {
      console.error('Email change error:', error)
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Current password is incorrect. Please try again.')
          break
        case 'auth/email-already-in-use':
          setError('This email address is already in use by another account.')
          break
        case 'auth/invalid-email':
          setError('Please enter a valid email address.')
          break
        case 'auth/requires-recent-login':
          setError('For security reasons, please sign out and sign back in before changing your email.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.')
          break
        case 'auth/operation-not-allowed':
          setError('Email changes are not currently allowed. Please contact support or check your Firebase project settings.')
          break
        default:
          setError(`Failed to update email: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewEmail('')
    setError(null)
    setSuccess(false)
    setVerificationSent(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Change Email Address
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Email
            </label>
            <input
              id="current-email"
              type="email"
              value={user?.email || ''}
              disabled
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-3 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="current-password-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Password *
            </label>
            <input
              id="current-password-email"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your current password"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Required for security verification
            </p>
          </div>

          <div>
            <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Email Address *
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your new email address"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">
                Email address updated successfully! You may need to verify your new email.
              </p>
            </div>
          )}

          {verificationSent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                A verification email has been sent to your new email address. Please check your inbox and click the verification link to complete the email change.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newEmail}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : verificationSent ? 'Verification Sent' : 'Update Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}