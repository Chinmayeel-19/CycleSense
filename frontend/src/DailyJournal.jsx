
import { useEffect, useState } from 'react'
import './DailyJournal.css'

const API_URL = 'http://127.0.0.1:8000'
const USER_ID = 2

const symptomOptions = [
  'Cramps',
  'Headache',
  'Bloating',
  'Fatigue',
  'Back pain',
  'Acne',
  'Nausea',
  'Breast tenderness'
]

const moodOptions = [
  'Happy',
  'Normal',
  'Anxious',
  'Sad',
  'Irritated'
]

function DailyJournal() {
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-CA')
  )

  const [symptoms, setSymptoms] = useState([])
  const [mood, setMood] = useState('Normal')
  const [energy, setEnergy] = useState(3)
  const [notes, setNotes] = useState('')

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load saved journal entries from the backend
  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await fetch(
          `${API_URL}/users/${USER_ID}/daily-logs/`
        )

        if (!response.ok) {
          throw new Error('Unable to load journal entries.')
        }

        const data = await response.json()
        setEntries(data)
      } catch (err) {
        setError(
          'Could not connect to the backend. Please check that your backend is running.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [])

  function toggleSymptom(symptom) {
    setSymptoms((previous) =>
      previous.includes(symptom)
        ? previous.filter((item) => item !== symptom)
        : [...previous, symptom]
    )
  }

  // Save a journal entry to the FastAPI database
  async function saveJournal() {
    setMessage('')
    setError('')

    if (!date) {
      setError('Please select a date.')
      return
    }

    const alreadySaved = entries.some(
      (entry) => entry.log_date === date
    )

    if (alreadySaved) {
      setError(
        'An entry already exists for this date. Editing existing entries is not available yet.'
      )
      return
    }

    setSaving(true)

    const journalData = {
      user_id: USER_ID,
      log_date: date,
      symptoms: symptoms.join(', '),
      mood: mood,
      notes: notes.trim()
    }

    try {
      const response = await fetch(`${API_URL}/daily-logs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(journalData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail || 'Unable to save your journal entry.'
        )
      }

      const savedEntry = await response.json()

      setEntries((previous) => [
        savedEntry,
        ...previous
      ])

      setMessage('Your health journal entry was saved successfully!')

      setSymptoms([])
      setMood('Normal')
      setEnergy(3)
      setNotes('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="journal-card">

      <div className="journal-header">
        <div>
          <span className="journal-tag">DAILY WELLNESS</span>
          <h2>My Health Journal ♡</h2>
          <p>Take a moment to check in with yourself.</p>
        </div>

        <div className="journal-icon">▤</div>
      </div>

      <div className="journal-form">

        <label className="journal-label">
          Journal date

          <input
            type="date"
            value={date}
            max={new Date().toLocaleDateString('en-CA')}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <div className="journal-field">
          <h3>How are you feeling physically?</h3>
          <p>Select all symptoms that apply.</p>

          <div className="symptom-grid">
            {symptomOptions.map((symptom) => (
              <button
                type="button"
                key={symptom}
                className={`symptom-chip ${
                  symptoms.includes(symptom) ? 'selected' : ''
                }`}
                onClick={() => toggleSymptom(symptom)}
              >
                {symptoms.includes(symptom) ? '✓ ' : '+ '}
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <div className="journal-field">
          <h3>How is your mood today?</h3>

          <div className="mood-grid">
            {moodOptions.map((option) => (
              <button
                type="button"
                key={option}
                className={`mood-chip ${
                  mood === option ? 'selected' : ''
                }`}
                onClick={() => setMood(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="journal-field energy-field">
          <div className="energy-heading">
            <div>
              <h3>Your energy level</h3>
              <p>How energetic do you feel?</p>
            </div>

            <strong>{energy}/5</strong>
          </div>

          <input
            type="range"
            min="1"
            max="5"
            value={energy}
            onChange={(event) =>
              setEnergy(Number(event.target.value))
            }
          />

          <div className="energy-labels">
            <span>Very low</span>
            <span>Very high</span>
          </div>
        </div>

        <div className="journal-field">
          <h3>Additional notes</h3>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Write anything you would like to remember about today..."
            rows="4"
          />
        </div>

        <p className="journal-info">
          Your date, symptoms, mood and notes will be saved in your
          health database. Energy level is currently recorded only
          in this form and is not saved to the database yet.
        </p>

        {loading && (
          <p className="journal-status">Loading your saved entries...</p>
        )}

        {message && (
          <p className="journal-success">{message}</p>
        )}

        {error && (
          <p className="journal-error">{error}</p>
        )}

        <button
          type="button"
          className="save-journal-button"
          onClick={saveJournal}
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save my journal ♡'}
        </button>

      </div>

      <div className="saved-entries">
        <h3>Previous journal entries</h3>

        {entries.length === 0 ? (
          <p>No saved entries yet. Start with today's check-in!</p>
        ) : (
          entries.map((entry) => (
            <div className="saved-entry" key={entry.id}>
              <strong>{entry.log_date}</strong>

              <p>Mood: {entry.mood || 'Not recorded'}</p>

              <p>
                Symptoms: {entry.symptoms || 'None recorded'}
              </p>

              {entry.notes && <p>Notes: {entry.notes}</p>}
            </div>
          ))
        )}
      </div>

    </div>
  )
}

export default DailyJournal
