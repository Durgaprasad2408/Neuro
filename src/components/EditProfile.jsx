import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function EditProfile({ isOpen, onClose, user }) {
  const [fullName, setFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile()
    }
  }, [isOpen, user])

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'profiles', user.uid)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const profile = docSnap.data()
        setFullName(profile.fullName || '')
        setDateOfBirth(profile.dateOfBirth || '')
        setGender(profile.gender || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    }
  }

  const calculateAge = (dob) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setError(null)
      setLoading(true)
      
      const profileData = {
        fullName,
        dateOfBirth,
        gender,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, 'profiles', user.uid), profileData)
      
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Edit Profile
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              id="edit-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-date-of-birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth
            </label>
            <input
              id="edit-date-of-birth"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
              required
            />
            {dateOfBirth && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Age: {calculateAge(dateOfBirth)} years old
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gender
            </label>
            <select
              id="edit-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Profile updated successfully!
            </p>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}