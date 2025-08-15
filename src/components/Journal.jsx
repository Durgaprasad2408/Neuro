import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore'
import MoodSelector from './MoodSelector'
import MoodInsights from './MoodInsights'
import JournalTable from './JournalTable'
import JournalCalendar from './JournalCalendar'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'

const greetings = [
  "Welcome back! Ready to reflect on your day?",
  "Take a moment to pause and check in with yourself.",
  "Your journey of self-discovery continues here.",
  "A new day brings new opportunities for growth.",
  "Your mental well-being matters. How are you today?",
  "Time to focus on you. How's your day going?",
  "Welcome to your safe space for reflection.",
  "Let's take a mindful moment together.",
]

const getFallbackMeditation = (mood) => {
  const baseGuidance = `Take a moment to acknowledge your ${mood} feelings. Find a comfortable position and follow these steps:

1. Take 3 deep breaths, inhaling for 4 counts and exhaling for 6 counts
2. Notice any tension in your body and consciously release it
3. Focus on the present moment, accepting your emotions without judgment
4. Remember that all feelings are temporary and valid

Continue this practice for a few minutes, being gentle with yourself.`

  return baseGuidance
}

export default function Journal({ user }) {
  const [entry, setEntry] = useState('')
  const [moodBefore, setMoodBefore] = useState(null)
  const [moodAfter, setMoodAfter] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [entries, setEntries] = useState([])
  const [showMoodAfter, setShowMoodAfter] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [saveTimeout, setSaveTimeout] = useState(null)
  const [greeting, setGreeting] = useState('')
  const [meditation, setMeditation] = useState('')
  const [loadingMeditation, setLoadingMeditation] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    // Select a random greeting when component mounts
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    setGreeting(randomGreeting)
  }, [])

  useEffect(() => {
    if (moodBefore) {
      fetchMeditation(moodBefore)
    }
  }, [moodBefore])

  const fetchMeditation = async (mood) => {
    try {
      setLoadingMeditation(true)
      setMeditation(getFallbackMeditation(mood))
    } catch (error) {
      console.error('Error fetching meditation guidance:', error)
      setMeditation('Unable to load meditation guidance at this time.')
    } finally {
      setLoadingMeditation(false)
    }
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new webkitSpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setEntry(prevEntry => prevEntry ? prevEntry + ' ' + transcript : transcript)
        
        if (!showMoodAfter && entry.length + transcript.length > 50) {
          setShowMoodAfter(true)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionInstance.onend = () => {
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const unsubscribe = fetchEntries()
      return () => unsubscribe && unsubscribe()
    }
  }, [user])

  const fetchEntries = () => {
    const q = query(
      collection(db, 'journalEntries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        entriesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        })
      })
      console.log('Fetched entries:', entriesData)
      setEntries(entriesData)
    })

    return unsubscribe
  }

  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    if (entry && moodBefore && user) {
      setSaving(true)
      const timeout = setTimeout(async () => {
        try {
          const entryData = {
            userId: user.uid,
            content: entry,
            moodBefore: moodBefore,
            moodAfter: moodAfter,
            updatedAt: new Date(),
          }

          if (currentEntryId) {
            // Update existing entry
            await updateDoc(doc(db, 'journalEntries', currentEntryId), entryData)
          } else {
            // Create new entry
            entryData.createdAt = new Date()
            const docRef = await addDoc(collection(db, 'journalEntries'), entryData)
            setCurrentEntryId(docRef.id)
          }

          setLastSaved(new Date())
        } catch (error) {
          console.error('Error saving entry:', error)
        } finally {
          setSaving(false)
        }
      }, 3000)

      setSaveTimeout(timeout)
    }

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [entry, moodBefore, moodAfter, user, currentEntryId])

  const handleContentChange = (e) => {
    setEntry(e.target.value)
    if (!showMoodAfter && e.target.value.length > 50) {
      setShowMoodAfter(true)
    }
  }

  const handleMoodBeforeSelect = (mood) => {
    setMoodBefore(mood)
    setEntry('')
    setCurrentEntryId(null)
    setMoodAfter(null)
    setShowMoodAfter(false)
  }

  const handleMoodAfterSelect = (mood) => {
    setMoodAfter(mood)
  }

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      recognition.start()
      setIsRecording(true)
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const getEntriesForDate = (date) => {
    if (!date) return []
    const dateStr = date.toDateString()
    return entries.filter(entry => 
      entry.createdAt && entry.createdAt.toDateString() === dateStr
    )
  }

  // Filter entries for MoodInsights to only those with valid mood & date
  const validEntries = entries.filter(
    (e) => e.moodBefore && e.createdAt
  )

  console.log('MoodInsights valid entries:', validEntries)

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <p className="text-lg italic text-gray-600 dark:text-gray-300 text-center mb-2">
          {greeting}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          How are you feeling right now?
        </h2>
        <MoodSelector onSelect={handleMoodBeforeSelect} selectedMood={moodBefore} />
      </div>

      {moodBefore && (
        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-primary-700 dark:text-primary-300 mb-4">
            Personalized Meditation & Guidance
          </h3>
          {loadingMeditation ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {meditation}
              </p>
            </div>
          )}
        </div>
      )}

      {moodBefore && (
        <div className="space-y-4">
          <div className="mb-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div>
              {saving ? (
                <span>Saving...</span>
              ) : (
                lastSaved && (
                  <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
                )
              )}
            </div>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ease-in-out ${
                isRecording
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isRecording ? (
                <>
                  <StopIcon className="w-5 h-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5" />
                  <span>Start Recording</span>
                </>
              )}
            </button>
          </div>
          <textarea
            className="journal-editor"
            placeholder="Start writing your thoughts... or click the microphone to use speech-to-text"
            value={entry}
            onChange={handleContentChange}
            autoFocus
            rows={3}
          />
        </div>
      )}

      {showMoodAfter && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            How are you feeling after writing?
          </h2>
          <MoodSelector onSelect={handleMoodAfterSelect} selectedMood={moodAfter} />
        </div>
      )}

      {validEntries.length > 0 && (
        <>
          {/* Mood Insights Graph */}
          <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Your Mood Insights
            </h2>
            <div style={{ height: 400 }}>
              <MoodInsights entries={validEntries} />
            </div>
          </div>

          {/* Calendar and Journal History Toggle */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Journal History
              </h2>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {showCalendar ? 'Show Table View' : 'Show Calendar View'}
              </button>
            </div>

            {showCalendar ? (
              <>
                <JournalCalendar 
                  entries={entries} 
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                />
                
                {selectedDate && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Entries for {selectedDate.toLocaleDateString()}
                    </h3>
                    <JournalTable entries={getEntriesForDate(selectedDate)} />
                  </div>
                )}
              </>
            ) : (
              <JournalTable entries={entries} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
