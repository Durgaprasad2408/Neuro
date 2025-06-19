import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import PropTypes from 'prop-types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function MoodInsights({ entries }) {
  console.log('MoodInsights received entries:', entries)

  // Filter entries that have both moodBefore and createdAt
  const validEntries = entries.filter(entry => 
    entry.moodBefore && 
    entry.createdAt && 
    entry.createdAt instanceof Date
  )

  console.log('Valid entries for mood insights:', validEntries)

  // Sort entries by date to show chronological progression (oldest first)
  const sortedEntries = [...validEntries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  console.log('Sorted entries:', sortedEntries)

  // Don't render if no valid data
  if (sortedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>No mood data available yet. Start journaling to see your mood insights!</p>
      </div>
    )
  }

  // Extract dates and moods for the graph
  const dates = sortedEntries.map(entry => {
    const date = new Date(entry.createdAt)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  const moodAfterData = sortedEntries.map(entry => moodToNumber(entry.moodAfter || entry.moodBefore))

  console.log('Chart data:', { dates, moodAfterData })

  const data = {
    labels: dates,
    datasets: [
      {
        label: 'Mood Progress',
        data: moodAfterData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 14,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Mood Changes Over Time',
        color: 'rgb(75, 85, 99)',
        font: {
          size: 18,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const entryIndex = context.dataIndex
            const entry = sortedEntries[entryIndex]
            const moodBefore = entry.moodBefore
            const moodAfter = entry.moodAfter || entry.moodBefore
            
            return [
              
              `Mood: ${moodAfter}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
          maxTicksLimit: 8,
          maxRotation: 45,
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 0.5,
        max: 5.5,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          color: 'rgb(107, 114, 128)',
          font: {
          size: 12,
          },
          callback: function (value) {
          const mood = numberToMood(Math.round(value))
          return mood || ''
          },
        },
        border: {
          display: false,
        },
      },
    },
  }

  function moodToNumber(mood) {
    const moodMap = {
      'happy': 5,
      'calm': 4,
      'neutral': 3,
      'sad': 2,
      'anxious': 1
    }
    
    const result = moodMap[mood?.toLowerCase()] || 3
    console.log(`Mapping mood "${mood}" to number ${result}`)
    return result
  }

  function numberToMood(number) {
    const numberMap = {
      5: 'Happy',
      4: 'Calm',
      3: 'Neutral',
      2: 'Sad',
      1: 'Anxious'
    }
    
    return numberMap[number] || ' '
  }

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  )
}

MoodInsights.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      moodBefore: PropTypes.string,
      moodAfter: PropTypes.string,
      createdAt: PropTypes.instanceOf(Date),
    })
  ).isRequired,
}