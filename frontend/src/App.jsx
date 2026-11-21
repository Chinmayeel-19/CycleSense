
import DailyJournal from './DailyJournal'
import Auth from './Auth'
import { useState, useEffect } from 'react'
import './App.css'

function getDateDifference(startDate) {
  if (!startDate) return null

  const [year, month, day] = startDate.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const today = new Date()

  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  return Math.floor((today - start) / (1000 * 60 * 60 * 24))
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function parseLocalDate(value) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function calculateDaysBetween(start, end) {
  const first = parseLocalDate(start)
  const second = parseLocalDate(end)

  if (!first || !second) return null

  return Math.round((second - first) / 86400000)
}

function calculateMedian(values) {
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 !== 0) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}

function getCycleLengths(records) {
  const sorted = [...records].sort((a, b) =>
    a.period_start_date.localeCompare(b.period_start_date)
  )

  const lengths = []

  for (let i = 1; i < sorted.length; i++) {
    const days = calculateDaysBetween(
      sorted[i - 1].period_start_date,
      sorted[i].period_start_date
    )

    if (days > 0) {
      lengths.push(days)
    }
  }

  return lengths
}


function App() {
  const [currentUser, setCurrentUser] = useState(null)
const [periodDate, setPeriodDate] = useState('')
const [cycleLength, setCycleLength] = useState(28)
const [periodLength, setPeriodLength] = useState(5)
// POST-PERIOD REFLECTION

const [reflectionAnswers, setReflectionAnswers] = useState({
  energy: 'Moderate',
  cramps: 'Mild',
  flow: 'Medium',
  mood: 'Neutral',
  symptoms: [],
  notes: ''
})

const [savedReflection, setSavedReflection] = useState(null)

useEffect(() => {
  if (!currentUser) return

  const saved = localStorage.getItem(
    `cyclesense_reflection_${currentUser.id}`
  )

  if (saved) {
    try {
      const parsed = JSON.parse(saved)

      setSavedReflection(parsed)
      setReflectionAnswers({
        energy: parsed.energy ?? 'Moderate',
        cramps: parsed.cramps ?? 'Mild',
        flow: parsed.flow ?? 'Medium',
        mood: parsed.mood ?? 'Neutral',
        symptoms: Array.isArray(parsed.symptoms)
          ? parsed.symptoms
          : [],
        notes: parsed.notes ?? ''
      })
    } catch {
      setSavedReflection(null)
    }
  }
}, [currentUser])

  const handleLogout = () => {
    localStorage.removeItem('cyclesense_token')
    localStorage.removeItem('cyclesense_user')
    setCurrentUser(null)
  }
const [menstrualRecords, setMenstrualRecords] = useState([])
const [loadingRecords, setLoadingRecords] = useState(false)
const [trackerMessage, setTrackerMessage] = useState('')


useEffect(() => {
  if (!currentUser) return

  const fetchMenstrualRecords = async () => {
    setLoadingRecords(true)

    try {
      const token = localStorage.getItem('cyclesense_token')

      const response = await fetch(
        `http://127.0.0.1:8000/users/${currentUser.id}/menstrual-records/`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Unable to load menstrual records')
      }

      const records = await response.json()

      setMenstrualRecords(records)

      if (records.length > 0) {
        const latest = records[0]

        setPeriodDate(latest.period_start_date)

        if (latest.cycle_length) {
          setCycleLength(latest.cycle_length)
        }

        if (latest.period_end_date) {
          const start = new Date(
            `${latest.period_start_date}T00:00:00`
          )

          const end = new Date(
            `${latest.period_end_date}T00:00:00`
          )

          const duration =
            Math.round((end - start) / 86400000) + 1

          setPeriodLength(duration)
        }
      }
    } catch (error) {
      console.error(error)
      setTrackerMessage('Could not load your cycle records.')
    } finally {
      setLoadingRecords(false)
    }
  }

  fetchMenstrualRecords()
}, [currentUser])
useEffect(() => {
  if (!currentUser) return

  const fetchReflection = async () => {
    try {
      const token = localStorage.getItem('cyclesense_token')

      const response = await fetch(
        `http://127.0.0.1:8000/users/${currentUser.id}/period-reflection/`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.status === 404) {
        setSavedReflection(null)
        return
      }

      if (!response.ok) {
        throw new Error('Unable to load period reflection')
      }

      const data = await response.json()

      setSavedReflection(data)

      setReflectionAnswers({
        energy: data.energy ?? 'Moderate',
        cramps: data.cramps ?? 'Mild',
        flow: data.flow ?? 'Medium',
        mood: data.mood ?? 'Neutral',
        symptoms: Array.isArray(data.symptoms)
          ? data.symptoms
          : [],
        notes: data.notes ?? ''
      })
    } catch (error) {
      console.error('Reflection loading error:', error)
    }
  }

  fetchReflection()
}, [currentUser])

const handleSaveReflection = async () => {
  if (!currentUser) return

  const token = localStorage.getItem('cyclesense_token')

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/users/${currentUser.id}/period-reflection/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reflectionAnswers)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Unable to save reflection')
    }

    const savedData = await response.json()

    setSavedReflection(savedData)
    setReflectionAnswers({
      energy: savedData.energy ?? 'Moderate',
      cramps: savedData.cramps ?? 'Mild',
      flow: savedData.flow ?? 'Medium',
      mood: savedData.mood ?? 'Neutral',
      symptoms: savedData.symptoms ?? [],
      notes: savedData.notes ?? ''
    })

    alert('Period reflection saved successfully!')
  } catch (error) {
    console.error('Reflection save error:', error)
    alert(error.message)
  }
}
  
if (!currentUser) {
  return <Auth onLogin={setCurrentUser} />
}
  
  const difference = getDateDifference(periodDate)

  // Calculate cycle lengths from saved period records
  const cycleLengths = getCycleLengths(menstrualRecords)

  // Use the median of previous cycles as the personal baseline
  const personalBaseline = calculateMedian(cycleLengths)

  // Adapt predictions using the user's recorded history
  const predictionCycleLength =
    personalBaseline ?? Number(cycleLength)

  const latestRecordedCycleLength =
    cycleLengths.length > 0
      ? cycleLengths[cycleLengths.length - 1]
      : null

  const cycleDay =
    difference !== null && difference >= 0
      ? difference + 1
      : null

  const nextPeriod = periodDate
    ? (() => {
        const date = parseLocalDate(periodDate)
        date.setDate(date.getDate() + predictionCycleLength)
        return date
      })()
    : null

  const ovulationDay = Math.max(10, predictionCycleLength - 14)

  let phase = 'Awaiting your dates'
  let phaseDescription = 'Add your last period date to explore your cycle.'

  if (cycleDay !== null) {
    if (cycleDay <= Number(periodLength)) {
      phase = 'Menstrual phase'
      phaseDescription =
        'Your period phase. Track your flow and how you feel.'
    } else if (cycleDay < ovulationDay - 1) {
      phase = 'Follicular phase'
      phaseDescription =
        'Your body is moving through the follicular phase.'
    } else if (cycleDay <= ovulationDay + 1) {
      phase = 'Around ovulation'
      phaseDescription =
        'An estimated ovulation window, not a confirmed event.'
    } else if (cycleDay <= predictionCycleLength) {
      phase = 'Luteal phase'
      phaseDescription =
        'The phase after the estimated ovulation window.'
    } else {
      phase = 'Past estimated cycle length'
      phaseDescription =
        'Your period has not been recorded yet. Cycles can vary.'
    }
  }

  const progress = cycleDay
    ? Math.min((cycleDay / predictionCycleLength) * 100, 100)
    : 0

  const cycleVariationDetected =
  personalBaseline !== null &&
  latestRecordedCycleLength !== null &&
  Math.abs(latestRecordedCycleLength - personalBaseline) > 7

// PERSONALIZED CYCLE ALERT

const cycleAlertMessage =
  cycleLengths.length < 2
    ? 'Keep recording your periods to build your personal cycle baseline.'
    : cycleVariationDetected
      ? `Your latest cycle (${latestRecordedCycleLength} days) differs from your personal median (${personalBaseline} days) by more than 7 days. Keep tracking this pattern.`
      : 'Your latest recorded cycle is within 7 days of your personal median.'

const cycleAlertType =
  cycleLengths.length < 2
    ? 'info'
    : cycleVariationDetected
      ? 'warning'
      : 'normal'

// CYCLE INTELLIGENCE

const cycleRange =
  cycleLengths.length > 0
    ? Math.max(...cycleLengths) - Math.min(...cycleLengths)
    : null

const cycleRegularity =
  cycleLengths.length < 2
    ? 'Building your history'
    : cycleRange <= 7
      ? 'Relatively consistent'
      : cycleRange <= 12
        ? 'Some variation'
        : 'High variation'

const averageCycleLength =
  cycleLengths.length > 0
    ? cycleLengths.reduce((total, days) => total + days, 0) /
      cycleLengths.length
    : null

const cycleIntelligenceMessage =
  cycleLengths.length < 2
    ? 'Record more period dates to understand your personal cycle pattern.'
    : cycleRange <= 7
      ? 'Your recorded cycle lengths show a relatively consistent pattern.'
      : 'Your recorded cycle lengths show some variation. Continue tracking to understand your pattern.'
  const invalidCycle =
    Number(cycleLength) < 21 ||
    Number(cycleLength) > 45 ||
    Number(periodLength) < 1 ||
    Number(periodLength) > 10

    const handleSavePeriod = async () => {
      console.log("UPDATE MY CYCLE BUTTON CLICKED")
  if (!periodDate || invalidCycle || difference < 0) {
    return
  }

  setTrackerMessage('')

  try {
    const token = localStorage.getItem('cyclesense_token')

    // Calculate the period end date from its duration
    const [year, month, day] = periodDate.split('-').map(Number)

    const endDate = new Date(year, month - 1, day)
    endDate.setDate(endDate.getDate() + Number(periodLength) - 1)

    const formattedEndDate = [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, '0'),
      String(endDate.getDate()).padStart(2, '0')
    ].join('-')

    const response = await fetch(
      'http://127.0.0.1:8000/menstrual-records/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          period_start_date: periodDate,
          period_end_date: formattedEndDate,
          notes: ''
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Unable to save period record')
    }

    // Retrieve the updated records
    const recordsResponse = await fetch(
      `http://127.0.0.1:8000/users/${currentUser.id}/menstrual-records/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!recordsResponse.ok) {
      throw new Error('Record saved, but unable to refresh the list')
    }

    const records = await recordsResponse.json()

    records.sort((a, b) =>
      b.period_start_date.localeCompare(a.period_start_date)
    )

    setMenstrualRecords(records)

    setPeriodDate(data.period_start_date)
    if (data.cycle_length) {
      setCycleLength(data.cycle_length)
    }

    setTrackerMessage('Your period record was saved successfully!')

  } catch (error) {
    console.error(error)
    setTrackerMessage(error.message)
  }
}

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✿</div>
          <div>
            <h2>CycleSense</h2>
            <span>AI HEALTH COMPANION</span>
          </div>
        </div>

        <p className="nav-heading">MENU</p>

        <nav>
          <a className="nav-item active" href="#dashboard">
            ▦ <span>Dashboard</span>
          </a>

          <a className="nav-item" href="#cycle">
            ◷ <span>Cycle Tracker</span>
          </a>

          <a className="nav-item" href="#insights">
            ✧ <span>AI Insights</span>
          </a>

          <a className="nav-item" href="#journal">
            ▤ <span>Health Journal</span>
          </a>

          <a className="nav-item" href="#assistant">
            ♡ <span>AI Assistant</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">♡</div>
            <h3>Your health matters.</h3>
            <p>Small steps today, healthier tomorrows.</p>
          </div>

          <a className="nav-item" href="#settings">
            ⚙ <span>Settings</span>
          </a>
        </div>
      </aside>

      {/* MAIN DASHBOARD */}
      <main className="main-content" id="dashboard">

        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR PERSONAL HEALTH SPACE</p>

            <h1>
              Good morning! <span>✿</span>
            </h1>

            <p className="subheading">
              Understand your body. Track your patterns. Feel empowered.
            </p>
          </div>

<div className="profile">
  <div className="notification">♧</div>

  <div className="avatar">
    {currentUser.name.charAt(0).toUpperCase()}
  </div>

  <div>
    <strong>{currentUser.name}</strong>
    <small>{currentUser.email}</small>
  </div>

  <button className="logout-button" onClick={handleLogout}>
    Logout
  </button>
</div>
        </header>

        {/* WELCOME BANNER */}
        <section className="welcome-banner">
          <div>
            <span className="banner-tag">
              ✧ YOUR WELLNESS JOURNEY
            </span>

            <h2>
              Your body has a story.
              <br />
              Let's understand it together.
            </h2>

            <p>
              Track your cycle, explore health patterns and discover insights
              powered by AI.
            </p>

            <button
              onClick={() =>
                document.getElementById('cycle')?.scrollIntoView({
                  behavior: 'smooth'
                })
              }
            >
              Explore my cycle <span>→</span>
            </button>
          </div>

          <div className="banner-art">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="flower">✿</div>
            <span className="sparkle sparkle-one">✧</span>
            <span className="sparkle sparkle-two">✦</span>
            <span className="sparkle sparkle-three">✧</span>
          </div>
        </section>

        {/* HEALTH OVERVIEW */}
        <section className="section-heading">
          <div>
            <h2>Your health overview</h2>
            <p>A quick look at your wellness journey</p>
          </div>

          <span className="today-label">
            ✦ TODAY'S OVERVIEW
          </span>
        </section>

        {/* STATISTICS */}
        <section className="stats-grid">

          <div className="stat-card pink">
            <div className="stat-top">
              <span>Cycle day</span>
              <span className="stat-icon">◷</span>
            </div>

            <h2>{cycleDay ?? '—'}</h2>

            <p>
              {cycleDay ? phase : 'Record your period dates'}
            </p>

            <span className="stat-note">
              {cycleDay
                ? 'Based on your entered date'
                : 'Waiting for your data'}
            </span>
          </div>

          <div className="stat-card purple">
            <div className="stat-top">
              <span>Next period</span>
              <span className="stat-icon">♡</span>
            </div>

            <h2>
              {nextPeriod ? formatDate(nextPeriod) : '—'}
            </h2>

            <p>Estimated next start date</p>

            <span className="stat-note">
              {nextPeriod
                ? 'Based on your cycle length'
                : 'Needs cycle history'}
            </span>
          </div>

          <div className="stat-card peach">
            <div className="stat-top">
              <span>Cycle average</span>
              <span className="stat-icon">⌁</span>
            </div>

            
<h2>
  {personalBaseline !== null
    ? `${personalBaseline} days`
    : '—'}
</h2>

<p>Your personal cycle average</p>

<span className="stat-note">
  {cycleLengths.length > 0
    ? `Calculated from ${cycleLengths.length} recorded cycle(s)`
    : 'Add at least two period records'}
</span>

          </div>

          <div className="stat-card green">
            <div className="stat-top">
              <span>Health journal</span>
              <span className="stat-icon">▤</span>
            </div>

            <h2>0</h2>

            <p>Daily entries recorded</p>

            <span className="stat-note">
              Start tracking today
            </span>
          </div>

        </section>

        {/* CYCLE TRACKER AND AI INSIGHTS */}
        <section className="content-grid">

          {/* CYCLE TRACKER */}
          <div className="panel cycle-panel" id="cycle">

            <div className="panel-heading">
              <div>
                <h2>Your cycle journey ♡</h2>
                <p>A personal view of your menstrual cycle</p>
              </div>

              <span className="pill">
                Interactive tracker
              </span>
            </div>

            <div className="cycle-tracker-layout">

              <div
                className="cycle-ring"
                style={{
                  background: `conic-gradient(#e78caf 0% ${progress}%, #eee3f4 ${progress}% 100%)`
                }}
              >
                <div className="cycle-ring-inner">
                  <span className="cycle-day-label">
                    CURRENT CYCLE DAY
                  </span>

                  <strong>{cycleDay ?? '—'}</strong>

                  <span>of {predictionCycleLength} days</span>
                </div>
              </div>

              <div className="cycle-details">
                <span className="phase-label">
                  YOUR CURRENT PHASE
                </span>

                <h3>{phase}</h3>

                <p>{phaseDescription}</p>

<div className={`cycle-alert ${cycleAlertType}`}>
  <strong>
    {cycleAlertType === 'warning'
      ? '✧ Cycle pattern alert'
      : cycleAlertType === 'info'
        ? '♡ Building your baseline'
        : '✓ Cycle pattern update'}
  </strong>

  <p>{cycleAlertMessage}</p>
</div>


                <div className="phase-legend">
                  <span>
                    <i className="dot period-dot"></i>
                    Period
                  </span>

                  <span>
                    <i className="dot follicular-dot"></i>
                    Follicular
                  </span>

                  <span>
                    <i className="dot ovulation-dot"></i>
                    Ovulation estimate
                  </span>

                  <span>
                    <i className="dot luteal-dot"></i>
                    Luteal
                  </span>
                </div>
              </div>

            </div>

            {/* TRACKER INPUTS */}
            <div className="tracker-form">
              <h3>Personalize your tracker ✿</h3>

              <p>
                Enter your details to calculate your cycle estimate.
              </p>

              <div className="tracker-inputs">

                <label>
                  Last period start date

                  <input
                    type="date"
                    value={periodDate}
                    max={new Date().toLocaleDateString('en-CA')}
                    onChange={(event) =>
                      setPeriodDate(event.target.value)
                    }
                  />
                </label>

                <label>
                  Usual cycle length (days)

                  <input
                    type="number"
                    min="21"
                    max="45"
                    value={cycleLength}
                    onChange={(event) =>
                      setCycleLength(event.target.value)
                    }
                  />
                </label>

                <label>
                  Period duration (days)

                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={periodLength}
                    onChange={(event) =>
                      setPeriodLength(event.target.value)
                    }
                  />
                </label>

              </div>

              {invalidCycle && (
                <p className="tracker-error">
                  Please enter a cycle length of 21–45 days and period
                  duration of 1–10 days.
                </p>
              )}

              {periodDate && difference < 0 && (
                <p className="tracker-error">
                  Please choose a period start date that is not in the future.
                </p>
              )}
<button
  type="button"
  className="primary-button"
  onClick={handleSavePeriod}
  disabled={invalidCycle || (periodDate && difference < 0)}
> 
             
                Update my cycle <span>♡</span>
              </button>
            </div>

            {nextPeriod && cycleDay !== null && (
              <div className="next-period-note">
                <span>♡</span>

                <div>
                  <strong>Estimated next period</strong>

                  <p>{formatDate(nextPeriod)}</p>

                  <small>
                    This is a simple estimate based on the dates you entered,
                    not a medical prediction.
                  </small>
                </div>
              </div>
            )}

          </div>

          {/* AI INSIGHTS */}
          <div className="panel insights-panel" id="insights">

            <div className="panel-heading">
              <div>
                <h2>AI health insights</h2>
                <p>Intelligent pattern monitoring</p>
              </div>

              <span className="ai-badge">
                ✧ AI
              </span>
            </div>

            <div className="insight-item">
              <div className="insight-icon lavender">✧</div>

              <div>
                <strong>Cycle pattern analysis</strong>
                <p>
                  AI will study changes in your recorded cycles.
                </p>
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-icon rose">♡</div>

              <div>
                <strong>PCOS risk screening</strong>
                <p>
                  Explore symptom-based screening insights.
                </p>
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-icon mint">⌁</div>

              <div>
                <strong>UTI symptom assessment</strong>
                <p>
                  Understand symptoms with guided assessment.
                </p>
              </div>
            </div>

            <p className="disclaimer">
              These features provide informational screening support,
              not medical diagnosis.
            </p>

          </div>
        
      </section>

{/* CYCLE REFLECTION */}
<section className="reflection-section" id="reflection">

  <div className="panel reflection-panel">

    <div className="panel-heading">
      <div>
        <h2>✿ Your Cycle Reflection</h2>
        <p>A personal overview of your menstrual patterns</p>
      </div>

      <span className="ai-badge">✧ PERSONAL INSIGHTS</span>
    </div>

    {cycleLengths.length > 0 ? (
      <>
        <div className="reflection-grid">

          <div className="reflection-stat">
            <span>Recorded cycles</span>
            <h3>{cycleLengths.length}</h3>
          </div>

          <div className="reflection-stat">
            <span>Personal average</span>
            <h3>{personalBaseline} days</h3>
          </div>

          <div className="reflection-stat">
            <span>Shortest cycle</span>
            <h3>{Math.min(...cycleLengths)} days</h3>
          </div>

          <div className="reflection-stat">
            <span>Longest cycle</span>
            <h3>{Math.max(...cycleLengths)} days</h3>
          </div>

        </div>
        <div className="cycle-history">

  <h3>♡ Your cycle history</h3>

  {cycleLengths.length > 0 ? (
    <div className="cycle-history-list">

      {cycleLengths.map((days, index) => (
        <div className="history-row" key={index}>

          <span className="history-label">
            Cycle {index + 1}
          </span>

          <div className="history-track">
            <div
              className="history-bar"
              style={{
                width: `${Math.min((days / 45) * 100, 100)}%`
              }}
            />
          </div>

          <strong>{days} days</strong>

        </div>
      ))}

    </div>
  ) : (
    <p>Save more period dates to build your cycle history.</p>
  )}

</div>

        <div className="reflection-message">
          <div className="intelligence-section">

  <h3>✧ Cycle Intelligence</h3>

  <div className="intelligence-grid">

    <div className="intelligence-card">
      <span>Cycle regularity</span>
      <strong>{cycleRegularity}</strong>
    </div>

    <div className="intelligence-card">
      <span>Cycle variation</span>
      <strong>
        {cycleRange !== null ? `${cycleRange} days` : 'Not available'}
      </strong>
    </div>

    <div className="intelligence-card">
      <span>Average cycle length</span>
      <strong>
        {averageCycleLength !== null
          ? `${averageCycleLength.toFixed(1)} days`
          : 'Not available'}
      </strong>
    </div>

  </div>

  <p className="intelligence-message">
    {cycleIntelligenceMessage}
  </p>

</div>
          <h3>Your cycle insights</h3>

          <p>
            Your latest recorded cycle was {latestRecordedCycleLength} days.
            Your personal average is {personalBaseline} days.
          </p>

          {cycleVariationDetected ? (
            <p>
              Your latest cycle differs noticeably from your personal
              average. Continue tracking to understand your pattern.
            </p>
          ) : (
            <p>
              Your latest recorded cycle is relatively close to your
              personal average.
            </p>
          )}

          {nextPeriod && (
            <p>
              Your next period is estimated around {formatDate(nextPeriod)}.
            </p>
          )}
        </div>
      </>
    ) : (
      <div className="reflection-empty">
        <span>♡</span>
        <h3>Your cycle story starts here</h3>
        <p>
          Record at least two period start dates to generate your
          personal cycle reflection.
        </p>
      </div>
    )}

    <p className="disclaimer">
      These insights are estimates based on recorded dates and are
      not medical diagnoses or confirmed ovulation predictions.
    </p>

  </div>

</section>

{/* HEALTH JOURNAL AND AI ASSISTANT */}


        {/* HEALTH JOURNAL AND AI ASSISTANT */}
        <section className="bottom-grid">
          {/* POST-PERIOD REFLECTION */}
<section className="post-period-section">
  <div className="panel post-period-panel">

    <div className="panel-heading">
      <div>
        <h2>♡ Post-Period Reflection</h2>
        <p>Reflect on how you felt during your latest period</p>
      </div>
      <span className="ai-badge">✧ PERSONAL JOURNAL</span>
    </div>

    <div className="reflection-form-grid">

      <label>
        Energy level
        <select
          value={reflectionAnswers.energy}
          onChange={(e) => setReflectionAnswers({
            ...reflectionAnswers,
            energy: e.target.value
          })}
        >
          <option>Low</option>
          <option>Moderate</option>
          <option>High</option>
        </select>
      </label>

      <label>
        Cramps
        <select
          value={reflectionAnswers.cramps}
          onChange={(e) => setReflectionAnswers({
            ...reflectionAnswers,
            cramps: e.target.value
          })}
        >
          <option>None</option>
          <option>Mild</option>
          <option>Moderate</option>
          <option>Severe</option>
        </select>
      </label>

      <label>
        Flow
        <select
          value={reflectionAnswers.flow}
          onChange={(e) => setReflectionAnswers({
            ...reflectionAnswers,
            flow: e.target.value
          })}
        >
          <option>Light</option>
          <option>Medium</option>
          <option>Heavy</option>
        </select>
      </label>

      <label>
        Mood
        <select
          value={reflectionAnswers.mood}
          onChange={(e) => setReflectionAnswers({
            ...reflectionAnswers,
            mood: e.target.value
          })}
        >
          <option>Calm</option>
          <option>Neutral</option>
          <option>Low</option>
          <option>Irritable</option>
        </select>
      </label>

    </div>
    <div className="reflection-symptoms">
  <p>Additional symptoms</p>

  {['Bloating', 'Headache', 'Fatigue', 'Breast tenderness', 'Nausea'].map(
    (symptom) => (
      <label key={symptom}>
        <input
          type="checkbox"
          checked={reflectionAnswers.symptoms.includes(symptom)}
          onChange={(e) => {
            const updatedSymptoms = e.target.checked
              ? [...reflectionAnswers.symptoms, symptom]
              : reflectionAnswers.symptoms.filter(
                  (item) => item !== symptom
                )

            setReflectionAnswers({
              ...reflectionAnswers,
              symptoms: updatedSymptoms
            })
          }}
        />
        {symptom}
      </label>
    )
  )}
</div>

    <label className="reflection-notes-label">
      Additional notes
      <textarea
        placeholder="Write about anything else you experienced..."
        value={reflectionAnswers.notes}
        onChange={(e) => setReflectionAnswers({
          ...reflectionAnswers,
          notes: e.target.value
        })}
      />
    </label>

    <button
      className="save-reflection-btn"
      onClick={handleSaveReflection}
    >
      Save my reflection ♡
    </button>

    {savedReflection && (
      <p className="reflection-saved-message">
        ✓ Your latest reflection has been saved.
      </p>
    )}

    <p className="disclaimer">
      Your reflection is for personal tracking and does not provide a medical diagnosis.
    </p>

  </div>
</section>

          <div id="journal">
            <DailyJournal />
          </div>

          <div className="panel assistant-panel" id="assistant">

            <div className="assistant-decoration">✿</div>

            <span className="banner-tag">
              YOUR AI COMPANION
            </span>

            <h2>Questions about your health?</h2>

            <p>
              Explore women's health topics with supportive,
              easy-to-understand information.
            </p>

            <button className="secondary-button">
              Meet your AI assistant <span>→</span>
            </button>

          </div>

        </section>

        {/* FOOTER */}
        <footer>
          <span>✿ CycleSense AI</span>

          <span>
            Designed for informed and empowered wellness.
          </span>

          <span>
            For educational support only · Not a medical diagnosis
          </span>
        </footer>

      </main>
    </div>
  )
}
export default App
