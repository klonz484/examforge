import { useEffect, useMemo, useState } from 'react'
import { Activity, Atom, BookOpen, CalendarDays, Check, ChevronRight, Clock3, FileText, Flame, FlaskConical, Home, LockKeyhole, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Sigma, Target, Upload, UserRound, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

type Tab = 'Dashboard' | 'Past Papers' | 'Upload Notes' | 'Progress'
type Question = { prompt: string; options: string[]; answer: number; explanation: string; topic: string }
const SCIENCE_QUESTIONS: Question[] = [
  { prompt: 'A block rests on a frictionless inclined plane at angle θ. What is the component of its weight perpendicular to the plane?', options: ['mg sin θ', 'mg cos θ', 'mg tan θ', 'mg'], answer: 1, explanation: 'Resolve the weight into components. The perpendicular component is mg cos θ, balanced by the normal force N.', topic: 'Mechanics' },
  { prompt: 'Which equation relates potential difference, current and resistance for an ohmic conductor?', options: ['P = VI', 'V = IR', 'Q = It', 'E = mc²'], answer: 1, explanation: 'Ohm’s law states that V = IR when physical conditions remain constant.', topic: 'Electricity' },
  { prompt: 'What is the SI unit of electric charge?', options: ['Ampere', 'Volt', 'Coulomb', 'Ohm'], answer: 2, explanation: 'Electric charge is measured in coulombs (C). Current is the rate of flow of charge.', topic: 'Electricity' },
  { prompt: 'A wave has frequency 5 Hz and wavelength 2 m. What is its speed?', options: ['2.5 m·s⁻¹', '7 m·s⁻¹', '10 m·s⁻¹', '20 m·s⁻¹'], answer: 2, explanation: 'Use v = fλ = 5 × 2 = 10 m·s⁻¹.', topic: 'Waves' },
  { prompt: 'Which statement describes an exothermic reaction?', options: ['Heat is absorbed from surroundings', 'Temperature must decrease', 'Energy is released to surroundings', 'No energy change occurs'], answer: 2, explanation: 'An exothermic reaction releases energy, usually as heat, to its surroundings.', topic: 'Chemical Change' },
  { prompt: 'A 2 kg trolley moves at 3 m·s⁻¹. What is its momentum?', options: ['1.5 kg·m·s⁻¹', '5 kg·m·s⁻¹', '6 kg·m·s⁻¹', '9 kg·m·s⁻¹'], answer: 2, explanation: 'Momentum p = mv = 2 × 3 = 6 kg·m·s⁻¹.', topic: 'Momentum & Impulse' },
  { prompt: 'A 10 N force moves an object 3 m in the direction of the force. How much work is done?', options: ['3.3 J', '13 J', '30 J', '300 J'], answer: 2, explanation: 'W = FΔx cos θ = 10 × 3 × cos 0° = 30 J.', topic: 'Energy & Work' },
  { prompt: 'How many moles are in 36 g of water? (M = 18 g·mol⁻¹)', options: ['0.5 mol', '2 mol', '18 mol', '648 mol'], answer: 1, explanation: 'n = m/M = 36 ÷ 18 = 2 mol.', topic: 'Stoichiometry' },
  { prompt: 'Which functional group is present in an alcohol?', options: ['–COOH', '–OH', '–NH₂', '–CHO'], answer: 1, explanation: 'Alcohols contain the hydroxyl group (–OH) attached to a carbon chain.', topic: 'Organic Chemistry' },
]
const MATHS_QUESTIONS: Question[] = [
  { prompt: 'Solve x² − 5x + 6 = 0.', options: ['x = 2 or x = 3', 'x = −2 or x = −3', 'x = 1 or x = 6', 'x = −1 or x = 6'], answer: 0, explanation: 'Factorise: (x − 2)(x − 3) = 0, so x = 2 or x = 3.', topic: 'Algebra' },
  { prompt: 'What is the turning point of y = (x − 2)² + 3?', options: ['(2 ; 3)', '(−2 ; 3)', '(2 ; −3)', '(3 ; 2)'], answer: 0, explanation: 'For y = a(x − p)² + q the turning point is (p ; q) = (2 ; 3).', topic: 'Functions' },
  { prompt: 'What does sin²θ + cos²θ equal?', options: ['0', '1', '2', 'tan θ'], answer: 1, explanation: 'This is the Pythagorean identity: sin²θ + cos²θ = 1.', topic: 'Trigonometry' },
  { prompt: 'Determine f′(x) if f(x) = x³.', options: ['3x²', 'x²', '3x', 'x⁴ ÷ 4'], answer: 0, explanation: 'Power rule: d/dx (xⁿ) = nxⁿ⁻¹, so f′(x) = 3x².', topic: 'Calculus' },
  { prompt: 'The angle subtended by an arc at the centre of a circle is ___ the angle it subtends at the circumference.', options: ['half', 'equal to', 'twice', 'three times'], answer: 2, explanation: 'Angle at the centre = 2 × angle at the circumference (same arc).', topic: 'Euclidean Geometry' },
  { prompt: 'What is the gradient of the line through (1 ; 2) and (3 ; 6)?', options: ['1', '2', '4', '½'], answer: 1, explanation: 'm = (y₂ − y₁) ÷ (x₂ − x₁) = (6 − 2) ÷ (3 − 1) = 2.', topic: 'Analytical Geometry' },
  { prompt: 'In the arithmetic sequence 3 ; 7 ; 11 ; … what is the 10th term?', options: ['39', '43', '40', '36'], answer: 0, explanation: 'Tₙ = a + (n − 1)d = 3 + 9 × 4 = 39.', topic: 'Sequences & Series' },
  { prompt: 'R1 000 is invested at 10% p.a. compound interest for 2 years. What is the final amount?', options: ['R1 200', 'R1 210', 'R1 100', 'R1 220'], answer: 1, explanation: 'A = P(1 + i)ⁿ = 1 000 × 1.1² = R1 210.', topic: 'Finance & Growth' },
]
const TOPICS: Record<string, string[]> = {
  'Physical Science': ['Mechanics', 'Electricity', 'Waves', 'Chemical Change', 'Organic Chemistry', 'Stoichiometry', 'Momentum & Impulse', 'Energy & Work'],
  'Mathematics': ['Algebra', 'Functions', 'Trigonometry', 'Calculus', 'Euclidean Geometry', 'Analytical Geometry', 'Sequences & Series', 'Finance & Growth'],
}
const papers = [
  { year: '2025', title: 'Physical Science Paper 1', subtitle: 'Physics · DBE November', tags: ['Mechanics', 'Electricity'], level: 'Hard' },
  { year: '2025', title: 'Mathematics Paper 2', subtitle: 'Geometry · Trigonometry', tags: ['Geometry', 'Trigonometry'], level: 'Medium' },
  { year: '2024', title: 'Physical Science Paper 2', subtitle: 'Chemistry · DBE November', tags: ['Organic', 'Stoichiometry'], level: 'Medium' },
  { year: '2024', title: 'Mathematics Paper 1', subtitle: 'Algebra · Functions', tags: ['Algebra', 'Functions'], level: 'Medium' },
]
const REWIND_SECONDS = 420
const ALLOWED_NOTE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_NOTE_BYTES = 10 * 1024 * 1024

type Session = { date: string; score: number; seconds: number; subject: string }
type Attempt = { topic: string; correct: boolean; t: number }
type Profile = { grade: string; examDate: string; subject: string; weak: string[] }

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}
function save(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage full or blocked */ } }
function localDate(d = new Date()) { return d.toLocaleDateString('en-CA') }
function dateAfterDays(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return localDate(d) }
function userStorageKey(userId: string | null, item: string) { return `ef:${userId ?? 'guest'}:${item}` }
function fmt(total: number) { return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}` }
function computeStreak(dates: string[]) {
  const set = new Set(dates)
  const d = new Date()
  if (!set.has(localDate(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(localDate(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
// Weak topics first, then the rest, 5 questions total.
function pickQuestions(subject: string, weak: string[]): Question[] {
  const pool = subject === 'Mathematics' ? MATHS_QUESTIONS : SCIENCE_QUESTIONS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const weakQs = shuffled.filter(q => weak.includes(q.topic))
  const rest = shuffled.filter(q => !weak.includes(q.topic))
  return [...weakQs, ...rest].slice(0, 5)
}

function App() {
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [subject, setSubject] = useState('Physical Science')
  const [grade, setGrade] = useState('12')
  const [examDate, setExamDate] = useState(() => dateAfterDays(20))
  const [weak, setWeak] = useState<string[]>([])
  const [sessionQs, setSessionQs] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [rewindOpen, setRewindOpen] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [remoteDates, setRemoteDates] = useState<string[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [notes, setNotes] = useState<File[]>([])
  const [noteStatus, setNoteStatus] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'in' | 'up'>('up')
  const [password, setPassword] = useState('')
  const [toast, setToast] = useState('')
  const [onboarded, setOnboarded] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  const today = localDate()
  const doneDates = useMemo(() => Array.from(new Set([...sessions.map(x => x.date), ...remoteDates])), [sessions, remoteDates])
  const rewindDone = doneDates.includes(today)
  const todaySession = sessions.find(x => x.date === today)
  const streak = computeStreak(doneDates)
  const topics = TOPICS[subject] ?? TOPICS['Physical Science']
  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate + 'T23:59:59').getTime() - Date.now()) / 86400000)) : null
  const currentQuestion = sessionQs[questionIndex]
  const score = answers.reduce((n, a, i) => n + (sessionQs[i] && a === sessionQs[i].answer ? 1 : 0), 0)
  const filteredPapers = useMemo(() => papers.filter(p => (filter === 'All' || (filter === 'Physical Science' ? p.title.includes('Physical Science') : filter === 'Mathematics' ? p.title.includes('Mathematics') : p.year === filter)) && (p.title + p.subtitle + p.tags.join(' ')).toLowerCase().includes(search.toLowerCase())), [filter, search])
  const subjectAttempts = attempts.filter(a => topics.includes(a.topic))
  const masteryFor = (t: string) => { const rows = attempts.filter(a => a.topic === t).slice(-20); return rows.length ? Math.round(100 * rows.filter(r => r.correct).length / rows.length) : null }
  const accuracy = subjectAttempts.length ? Math.round(100 * subjectAttempts.filter(a => a.correct).length / subjectAttempts.length) : null

  // Rewind timer: counts active, visible time only.
  useEffect(() => {
    if (!rewindOpen) return
    const id = window.setInterval(() => { if (!document.hidden) setSeconds(x => x + 1) }, 1000)
    return () => window.clearInterval(id)
  }, [rewindOpen])
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(id) }, [toast])

  // Auth state.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  // Every account gets an isolated browser-storage namespace. Guests always start from defaults.
  useEffect(() => {
    const userId = user?.id ?? null
    setTab('Dashboard'); setSessionQs([]); setQuestionIndex(0); setSelected(null); setAnswers([])
    setRewindOpen(false); setSeconds(0); setRemoteDates([]); setNotes([]); setNoteStatus('')
    setSessions(userId ? load<Session[]>(userStorageKey(userId, 'sessions'), []) : [])
    setAttempts(userId ? load<Attempt[]>(userStorageKey(userId, 'attempts'), []) : [])
    setWeak([]); setGrade('12'); setSubject('Physical Science'); setExamDate(dateAfterDays(20))
    setOnboarded(false); setShowOnboarding(true)
    if (!userId || !supabase) return
    const client = supabase
    let active = true
    ;(async () => {
      const { data: profile, error: profileError } = await client.from('profiles')
        .select('grade,exam_date,primary_subject,weak_topics').eq('id', userId).maybeSingle()
      if (!active) return
      if (profileError) { console.error('Profile load failed:', profileError.message); return }
      if (profile) {
        const p: Profile = { grade: String(profile.grade ?? '12'), examDate: profile.exam_date ?? dateAfterDays(20), subject: profile.primary_subject ?? 'Physical Science', weak: profile.weak_topics ?? [] }
        setGrade(p.grade); setExamDate(p.examDate); setSubject(p.subject); setWeak(p.weak)
        setOnboarded(true); setShowOnboarding(false)
        save(userStorageKey(userId, 'profile'), p)
      } else {
        const localProfile = load<Profile | null>(userStorageKey(userId, 'profile'), null)
        if (localProfile) {
          setGrade(localProfile.grade); setExamDate(localProfile.examDate); setSubject(localProfile.subject); setWeak(localProfile.weak)
          setOnboarded(true); setShowOnboarding(false)
        }
      }
      const { data: rows, error: sessionsError } = await client.from('study_sessions')
        .select('completed_at').eq('user_id', userId).order('completed_at', { ascending: false }).limit(120)
      if (active && !sessionsError && rows) setRemoteDates(rows.map(r => localDate(new Date(r.completed_at as string))))
    })()
    return () => { active = false }
  }, [user?.id])

  async function signIn() {
    if (!supabase) { setToast('Add your Supabase URL and publishable key to .env.local first.'); return }
    if (!userEmail.includes('@')) { setToast('Enter a valid email address.'); return }
    if (password.length < 8) { setToast('Password must be at least 8 characters.'); return }
    const result = authMode === 'up' ? await supabase.auth.signUp({ email: userEmail, password }) : await supabase.auth.signInWithPassword({ email: userEmail, password })
    if (result.error) { setToast(result.error.message); return }
    // A first-time account may adopt the current guest setup once; existing accounts are never overwritten.
    if (authMode === 'in' && result.data.user) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', result.data.user.id).maybeSingle()
      if (!existing) {
        const { error: seedError } = await supabase.from('profiles').upsert({
          id: result.data.user.id, grade: Number(grade), exam_date: examDate,
          primary_subject: subject, weak_topics: weak,
        })
        if (seedError) console.error('Initial profile save failed:', seedError.message)
      }
    }
    setAuthOpen(false); setPassword('')
    setToast(authMode === 'up' ? 'Check your email to confirm your account.' : 'You are signed in.')
  }
  async function signOut() { setMenuOpen(false); await supabase?.auth.signOut(); setToast('Signed out.') }

  function startRewind() {
    if (rewindDone) return
    setSessionQs(pickQuestions(subject, weak)); setQuestionIndex(0); setSelected(null); setAnswers([]); setSeconds(0); setRewindOpen(true)
  }
  async function finishRewind() {
    const entry: Session = { date: today, score, seconds, subject }
    const next = [...sessions, entry]
    setSessions(next); if (user) save(userStorageKey(user.id, 'sessions'), next); setRewindOpen(false)
    if (supabase && user) {
      const { error } = await supabase.from('study_sessions').insert({ subject, session_type: 'rewind', duration_seconds: seconds, score, total_questions: sessionQs.length })
      if (error) { console.error(error.message); setToast(`Rewind done: ${score}/${sessionQs.length}. Saved on this device only — sync failed.`); return }
      setRemoteDates(d => [...d, today])
    }
    setToast(`Rewind complete: ${score}/${sessionQs.length} correct.`)
  }
  async function chooseAnswer(i: number) {
    if (selected !== null || !currentQuestion) return
    setSelected(i); setAnswers(a => [...a.slice(0, questionIndex), i])
    const correct = i === currentQuestion.answer
    const next = [...attempts, { topic: currentQuestion.topic, correct, t: Date.now() }].slice(-500)
    setAttempts(next); if (user) save(userStorageKey(user.id, 'attempts'), next)
    if (supabase && user) {
      const { error } = await supabase.from('question_attempts').insert({ source_type: 'seed', topic: currentQuestion.topic, is_correct: correct, response: { selected: i } })
      if (error) console.error('Attempt sync failed:', error.message)
    }
  }
  function nextQuestion() { if (questionIndex >= sessionQs.length - 1) { finishRewind(); return } setQuestionIndex(i => i + 1); setSelected(null) }

  function pickNotes(files: File[]) {
    const ok: File[] = []; const problems: string[] = []
    for (const f of files) {
      if (!ALLOWED_NOTE_TYPES.includes(f.type)) problems.push(`${f.name}: use JPG, PNG, WebP or PDF`)
      else if (f.size > MAX_NOTE_BYTES) problems.push(`${f.name}: over 10 MB`)
      else ok.push(f)
    }
    setNotes(ok); setNoteStatus(problems.join(' · '))
  }
  async function uploadNotes() {
    if (!notes.length) return
    if (!supabase) { setNoteStatus(`${notes.length} file(s) selected. Connect Supabase to securely upload and process them.`); return }
    if (!user) { setAuthOpen(true); setNoteStatus('Sign in before uploading private notes.'); return }
    setNoteStatus('Uploading securely…')
    for (const file of notes) {
      const safeName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
      const { error } = await supabase.storage.from('student-notes').upload(safeName, file, { upsert: false })
      if (error) { setNoteStatus(`Upload failed: ${error.message}`); return }
      const { error: rowError } = await supabase.from('note_uploads').insert({ storage_path: safeName, original_name: file.name, mime_type: file.type, size_bytes: file.size, processing_status: 'queued' })
      if (rowError) { await supabase.storage.from('student-notes').remove([safeName]); setNoteStatus(`Could not record upload: ${rowError.message}`); return }
    }
    setNotes([]); setNoteStatus('Upload complete. AI question drafting is not switched on yet — your notes are stored privately.')
  }
  function toggleTopic(topic: string) { setWeak(w => w.includes(topic) ? w.filter(t => t !== topic) : [...w, topic]) }
  function chooseSubject(name: string) { if (name !== subject) { setSubject(name); setWeak([]) } }
  async function saveOnboarding() {
    const p: Profile = { grade, examDate, subject, weak }
    if (user) save(userStorageKey(user.id, 'profile'), p)
    setOnboarded(true); setShowOnboarding(false)
    if (supabase && user) {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, grade: Number(grade), exam_date: examDate, primary_subject: subject, weak_topics: weak })
      if (error) { console.error('Profile sync failed:', error.message); setToast('Could not sync your study focus. Please try again.'); return }
    }
    setToast('Your study focus is set. Rewind first.')
  }

  if (showOnboarding) return <div className="onboard-wrap"><div className="brand"><span className="brand-mark"><Flame size={29} fill="currentColor"/></span><span>Exam<span>Forge</span></span></div><div className="onboard-hero"><p className="eyebrow">STUDY. PRACTICE. EXCEL.</p><h1>Set up your<br/><em>exam focus</em></h1><p className="muted">We’ll tailor your practice to what matters most.</p></div><section className="panel onboarding"><label className="field-label"><CalendarDays size={18}/> Exam date</label><input type="date" min={today} value={examDate} onChange={e=>setExamDate(e.target.value)}/><label className="field-label"><UserRound size={18}/> Your grade</label><div className="choice-row">{['10','11','12'].map(g=><button key={g} className={`choice ${grade===g?'chosen':''}`} onClick={()=>setGrade(g)}>Grade {g}</button>)}</div><label className="field-label"><Settings2 size={18}/> Select your subject</label><div className="subject-grid"><button className={`subject-card ${subject==='Physical Science'?'chosen':''}`} onClick={()=>chooseSubject('Physical Science')}><Atom/><b>Physical Science</b><small>Physics & Chemistry</small></button><button className={`subject-card ${subject==='Mathematics'?'chosen':''}`} onClick={()=>chooseSubject('Mathematics')}><Sigma/><b>Mathematics</b><small>Algebra & Geometry</small></button></div><label className="field-label"><Target size={18}/> Your weakest topics</label><div className="topic-pills">{topics.map(t=><button key={t} onClick={()=>toggleTopic(t)} className={`pill ${weak.includes(t)?'selected':''}`}>{t}</button>)}</div><p className="hint">Choose at least 2 topics. You can change this anytime.</p><button className="primary full" disabled={weak.length<2 || !examDate} onClick={saveOnboarding}>Start Forging <ChevronRight size={20}/></button><p className="privacy"><LockKeyhole size={14}/> Your data stays private. Focus built for you.</p></section></div>

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Flame size={28} fill="currentColor"/></span><span>Exam<span>Forge</span><small>Study. Practice. Excel.</small></span></div><div className="top-actions"><span className={`connection ${isSupabaseConfigured?'online':''}`} title={isSupabaseConfigured?(user?'Signed in':'Supabase configured — not signed in'):'Demo mode'}></span><button className="icon-btn" onClick={()=>setMenuOpen(v=>!v)} aria-label="Menu" aria-expanded={menuOpen}><Menu/></button></div></header>
    {menuOpen && <div className="menu-pop">{user && <div className="who">{user.email}</div>}<button onClick={()=>{setShowOnboarding(true);setMenuOpen(false)}}><Settings2 size={16}/> Study settings</button>{!user && <button onClick={()=>{setAuthOpen(true);setMenuOpen(false)}}><UserRound size={16}/> Account / sign in</button>}{user && <button onClick={signOut}><LogOut size={16}/> Sign out</button>}</div>}
    <main className="main-content">
      {tab==='Dashboard' && <>
        <div className="welcome-row"><div><p className="eyebrow">YOUR DAILY STUDY SYSTEM</p><h1>Tonight’s <em>20.</em></h1><p className="muted">No guessing. Do the work that moves your mark.</p></div><div className="countdown"><strong>{daysLeft ?? '—'}</strong><span>days left</span></div></div>
        <section className="stat-strip"><div><span>🔥 Streak</span><b>{streak} day{streak===1?'':'s'}</b></div><div><span><Target size={14}/> Weakest topic</span><b>{weak[0] || 'Choose topics'}</b></div><div><span><FileText size={14}/> Rewinds done</span><b>{doneDates.length}</b></div></section>
        <section className="tonight-card"><div className="card-top"><span className="section-kicker"><Flame size={17} fill="currentColor"/> TONIGHT’S 20</span><span className="tag-orange">{rewindDone?'Completed':'Daily mission'}</span></div><h2>{rewindDone?'You showed up. That counts.':'Rewind first. Then we move.'}</h2><p className="muted">{rewindDone?'Your session is complete. Come back tomorrow to keep the streak alive.':'5 targeted questions · 7 minutes · weak topics first. No skipping.'}</p><div className="mission-progress"><span style={{width:`${rewindDone?100:0}%`}}/></div><div className="mission-meta"><span>{rewindDone?`Score: ${todaySession?`${todaySession.score}/5`:'done'}`:'5 questions'}</span><span><Clock3 size={14}/> {rewindDone&&todaySession?fmt(todaySession.seconds):'7:00'} {rewindDone?'active':'target'}</span></div><button className="primary full" disabled={rewindDone} onClick={startRewind}>{rewindDone?'Done for tonight ✓':'Start 7-minute Rewind'} {!rewindDone&&<ChevronRight size={19}/>}</button></section>
        <div className="section-heading"><div><h2>Today’s prescribed work</h2><p className="muted">One specific task. Finish it properly.</p></div><span className="tag">Roadmap</span></div>
        <section className={`task-card ${rewindDone?'':'locked'}`}><div className="task-icon">{rewindDone?<Atom/>:<LockKeyhole/>}</div><div className="task-copy"><b>{subject==='Physical Science'?'Q2 · Inclined plane':'Q3 · Quadratic functions'}</b><p>2025 DBE Trial · Paper 1 (sample task)</p><small>{rewindDone?(subject==='Physical Science'?'Draw a free-body diagram. Show N = mg cos θ.':'Complete the sketch and identify the turning point.'):'Locked until you finish tonight’s Rewind.'}</small></div><button className="round-arrow" disabled={!rewindDone} aria-label="Open past papers" onClick={()=>setTab('Past Papers')}><ChevronRight/></button></section>
        <div className="section-heading"><div><h2>Your focus</h2><p className="muted">Work on these before exam day.</p></div><button className="text-btn" onClick={()=>setShowOnboarding(true)}>Edit</button></div><div className="topic-pills dashboard-pills">{weak.map(t=><span className="pill selected" key={t}>{t}</span>)}</div>
      </>}
      {tab==='Past Papers' && <><div className="page-heading"><p className="eyebrow">PRACTISE THE REAL THING</p><h1>Past Papers</h1><p className="muted">Attempt. Mark. Learn from every mistake.</p></div><div className="searchbox"><Search size={18}/><input placeholder="Search past papers…" value={search} onChange={e=>setSearch(e.target.value)}/><Settings2 size={18}/></div><div className="filter-row">{['All','Physical Science','Mathematics','2025','2024'].map(f=><button className={`filter ${filter===f?'active':''}`} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><h3 className="subheading">{filteredPapers.length} sample listings</h3><div className="paper-list">{filteredPapers.map((p,i)=><article className="paper-card" key={p.title}><div className={`paper-symbol sym-${i%3}`}>{p.title.includes('Mathematics')?<Sigma/>:<Atom/>}</div><div className="paper-main"><div className="paper-title-row"><span className="paper-year">{p.year}</span><div><b>{p.title}</b><small>{p.subtitle}</small></div></div><div className="paper-tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="paper-action"><small>{p.level}</small><span>Sample</span><button className="small-primary" disabled>Coming soon</button></div></article>)}</div><p className="hint">Sample listings only. Real paper files and official memos will be added before launch.</p></>}
      {tab==='Upload Notes' && <><div className="page-heading"><p className="eyebrow purple-text">YOUR NOTES. YOUR QUESTIONS.</p><h1>Upload Notes</h1><p className="muted">Add notes to generate targeted practice questions.</p></div><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={e=>pickNotes(Array.from(e.target.files||[]))}/><div className="upload-icon"><Upload size={30}/></div><b>Take a photo or upload a PDF</b><p>Capture handwritten or printed notes instantly.</p><span className="upload-link">Choose files <Plus size={15}/></span><small>JPG, PNG, WebP or PDF · Max 10 MB per file</small></label>{notes.length>0&&<div className="selected-files">{notes.map((f,i)=><div key={`${f.name}-${i}`}><FileText size={17}/><span>{f.name}</span><button aria-label={`Remove ${f.name}`} onClick={()=>setNotes(a=>a.filter(x=>x!==f))}><X size={16}/></button></div>)}<button className="primary full" onClick={uploadNotes}>Upload {notes.length} file(s) <ChevronRight size={18}/></button></div>}{noteStatus&&<p className="status-message">{noteStatus}</p>}<section className="purple-panel"><div className="purple-icon"><FlaskConical/></div><div><b>What happens next?</b><p>Coming soon: ExamForge will extract your notes, check confidence, and draft questions linked to your weak topics. You review them before they enter Rewind. For now, uploads are stored privately.</p></div></section><div className="section-heading"><div><h2>Recently uploaded</h2><p className="muted">Your study material library</p></div></div><div className="empty-state"><BookOpen size={30}/><b>Nothing to show yet</b><p>Your uploaded pages and generated questions will appear here.</p></div></>}
      {tab==='Progress' && <><div className="page-heading"><p className="eyebrow">HONEST FEEDBACK</p><h1>Your Progress</h1><p className="muted">Track the work, not just the feeling.</p></div><div className="progress-summary"><div><span>Study sessions</span><b>{doneDates.length}</b><div className="bar"><i style={{width:`${Math.min(100,doneDates.length*5)}%`}}/></div></div><div><span>Current streak</span><b>{streak}</b><div className="bar bluebar"><i style={{width:`${Math.min(100,streak*10)}%`}}/></div></div><div><span>Rewind accuracy</span><b>{accuracy===null?'—':`${accuracy}%`}</b><div className="bar"><i style={{width:`${accuracy??0}%`}}/></div></div></div><section className="panel progress-panel"><h3>Topic mastery</h3>{topics.map(t=>{const m=masteryFor(t);return <div className="mastery-row" key={t}><span>{t}</span><b>{m===null?'—':`${m}%`}</b><div className="bar"><i style={{width:`${m??0}%`}}/></div></div>})}</section><section className="panel"><h3>Study activity</h3>{doneDates.length===0?<div className="activity-empty"><Activity size={25}/><p>Complete your first Rewind to start building your activity history.</p></div>:<div className="activity-empty"><Activity size={25}/><p>{doneDates.length} Rewind{doneDates.length===1?'':'s'} completed. Last: {[...doneDates].sort().slice(-1)[0]}.</p></div>}</section><p className="hint">Mastery is based on your last 20 answers per topic. A dash means no answers yet.</p></>}
    </main>
    <nav className="bottom-nav">{([{name:'Dashboard' as Tab,icon:Home},{name:'Past Papers' as Tab,icon:FileText},{name:'Upload Notes' as Tab,icon:Plus},{name:'Progress' as Tab,icon:Activity}] as const).map(item=><button key={item.name} className={tab===item.name?'current':''} onClick={()=>setTab(item.name)}><item.icon size={21}/><span>{item.name==='Upload Notes'?'Upload':item.name}</span></button>)}</nav>
    {rewindOpen && currentQuestion && <div className="rewind-overlay"><header className="rewind-head"><span style={{width:36}}/><b>ExamForge <span>/ Rewind {questionIndex+1}/{sessionQs.length}</span></b><strong><Clock3 size={17}/> {fmt(Math.max(0,REWIND_SECONDS-seconds))}</strong></header><div className="rewind-body"><div className="rewind-label"><Flame size={18} fill="currentColor"/> FULL-SCREEN REWIND</div><div className="question-card"><span className="question-source">{subject} · {currentQuestion.topic}</span><h2>{currentQuestion.prompt}</h2><div className="answer-list">{currentQuestion.options.map((o,i)=><button key={o} className={`answer-option ${selected===i?'picked':''} ${selected!==null&&i===currentQuestion.answer?'correct':''} ${selected===i&&i!==currentQuestion.answer?'incorrect':''}`} onClick={()=>chooseAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{o}{selected!==null&&i===currentQuestion.answer&&<Check className="answer-check"/>}</button>)}</div>{selected!==null&&<div className="explanation"><b>{selected===currentQuestion.answer?'Correct.':'Not quite. Learn the method.'}</b><p>{currentQuestion.explanation}</p></div>}</div><button className="primary full submit-answer" disabled={selected===null} onClick={nextQuestion}>{questionIndex>=sessionQs.length-1?'Finish Rewind':'Next question'} <ChevronRight/></button><p className="privacy"><ShieldCheck size={15}/> Active time only — the timer pauses if you leave the app</p></div></div>}
    {authOpen&&<div className="modal-backdrop" onClick={()=>setAuthOpen(false)}><section className="auth-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setAuthOpen(false)}><X/></button><div className="brand"><span className="brand-mark"><Flame fill="currentColor"/></span><span>Exam<span>Forge</span></span></div><h2>{authMode==='up'?'Create your account':'Welcome back'}</h2><p className="muted">Your progress follows you across devices.</p><label>Email address</label><input type="email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} placeholder="you@example.com"/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button className="primary full" onClick={signIn}>{authMode==='up'?'Create account':'Sign in'}</button><button className="text-btn centered" onClick={()=>setAuthMode(m=>m==='up'?'in':'up')}>{authMode==='up'?'Already have an account? Sign in':'New to ExamForge? Create account'}</button></section></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>
}
export default App
