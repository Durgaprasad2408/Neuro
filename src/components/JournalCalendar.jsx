import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const moodColors = {
  happy: 'bg-green-200 dark:bg-green-800',
  calm: 'bg-blue-200 dark:bg-blue-800',
  neutral: 'bg-gray-200 dark:bg-gray-600',
  sad: 'bg-blue-300 dark:bg-blue-700',
  anxious: 'bg-red-200 dark:bg-red-800',
}

export default function JournalCalendar({ entries, onDateSelect, selectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEntriesForDate = (date) => {
    const dateStr = date.toDateString()
    return entries.filter(entry => 
      entry.createdAt && entry.createdAt.toDateString() === dateStr
    )
  }

  const getMoodForDate = (date) => {
    const dayEntries = getEntriesForDate(date)
    if (dayEntries.length === 0) return null
    
    // Get the most recent entry's mood (either moodAfter or moodBefore)
    const latestEntry = dayEntries[0] // entries are sorted by createdAt desc
    return latestEntry.moodAfter || latestEntry.moodBefore
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-12 w-12"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const mood = getMoodForDate(date)
      const hasEntries = getEntriesForDate(date).length > 0
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
      const isToday = date.toDateString() === new Date().toDateString()

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(date)}
          className={`h-12 w-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 relative ${
            isSelected
              ? 'ring-2 ring-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : isToday
              ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700'
              : hasEntries
              ? `${moodColors[mood] || 'bg-gray-100 dark:bg-gray-700'} text-gray-800 dark:text-gray-200 hover:opacity-80`
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {day}
          {hasEntries && (
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-current opacity-60"></div>
          )}
        </button>
      )
    }

    return days
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Mood Legend</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800"></div>
            <span className="text-gray-600 dark:text-gray-400">Happy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800"></div>
            <span className="text-gray-600 dark:text-gray-400">Calm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-300 dark:bg-blue-700"></div>
            <span className="text-gray-600 dark:text-gray-400">Sad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-800"></div>
            <span className="text-gray-600 dark:text-gray-400">Anxious</span>
          </div>
        </div>
      </div>
    </div>
  )
}