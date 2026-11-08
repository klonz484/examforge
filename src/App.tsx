import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Atom, BookOpen, CalendarDays, Check, ChevronRight, Clock3, FileText, Flame, FlaskConical, Home, LockKeyhole, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Sigma, Sun, Moon, Target, Upload, UserRound, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import { Button, Dialog, Navigation, TextField } from './components/ui'
import { CAPS_SUBJECTS, searchCapsSubjects, type CapsSubject } from './data/capsSubjects'
import { selectPracticeQuestions, type PracticeQuestion } from './data/practiceQuestions'

type Tab = 'Dashboard' | 'Past Papers' | 'Upload Notes' | 'Progress'
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
const REWIND_SECONDS = 20 * 60
const ALLOWED_NOTE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_NOTE_BYTES = 10 * 1024 * 1024

type Session = { date: string; score: number; seconds: number; subject: string }
type Attempt = { topic: string; correct: boolean; t: number; sessionId?: string; questionId?: string; response?: { selected: number } }
type SessionSnapshot = { id?: string; subject: string; subjectId: string; grade: number; questions: PracticeQuestion[]; questionIndex: number; answers: number[]; seconds: number; startedAt: string }
type SessionSummary = { session: Session; questions: PracticeQuestion[]; answers: number[] }
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
function App() {
  const [tab, setTab] = useState<Tab>('Dashboard')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => load<'dark' | 'light'>('ef:theme', 'dark'))
  const [subject, setSubject] = useState('Physical Science')
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(['physical-science'])
  const [catalogueSearch, setCatalogueSearch] = useState('')
  const [allSubjectsOpen, setAllSubjectsOpen] = useState(false)
  const [grade, setGrade] = useState('12')
  const [examDate, setExamDate] = useState(() => dateAfterDays(20))
  const [weak, setWeak] = useState<string[]>([])
  const [sessionQs, setSessionQs] = useState<PracticeQuestion[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionStartedAt, setSessionStartedAt] = useState('')
  const [recoverableSession, setRecoverableSession] = useState<SessionSnapshot | null>(null)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
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
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Keep the application and shared UI theme attributes in sync.
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.uiTheme = theme
  }, [theme])

  const today = localDate()
  const doneDates = useMemo(() => Array.from(new Set([...sessions.map(x => x.date), ...remoteDates])), [sessions, remoteDates])
  const rewindDone = doneDates.includes(today)
  const todaySession = sessions.find(x => x.date === today)
  const streak = computeStreak(doneDates)
  const topics = TOPICS[subject] ?? TOPICS['Physical Science']
  const enrolledSubjects = selectedSubjectIds.map(id => CAPS_SUBJECTS.find(item => item.id === id)).filter((item): item is CapsSubject => Boolean(item))
  const dashboardSubjects = enrolledSubjects.slice(0, 7)
  const catalogueResults = searchCapsSubjects(catalogueSearch, Number(grade) as 10 | 11 | 12).filter(item => item.status !== 'pathway-parent')
  const activeSubjectId = enrolledSubjects.find(item => item.id === (subject === 'Physical Science' || subject === 'Physical Sciences' ? 'physical-science' : subject === 'Mathematics' ? 'mathematics' : ''))?.id ?? selectedSubjectIds[0]
  const hasStarterQuestionBank = ['Mathematics', 'Physical Science', 'Physical Sciences'].includes(subject)
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
    setRewindOpen(false); setSeconds(0); setRemoteDates([]); setNotes([]); setNoteStatus(''); setActiveSessionId(null); setSessionStartedAt(''); setSessionSummary(null)
    setRecoverableSession(load<SessionSnapshot | null>(userStorageKey(userId, 'active-session'), null))
    setSessions(userId ? load<Session[]>(userStorageKey(userId, 'sessions'), []) : [])
    setAttempts(userId ? load<Attempt[]>(userStorageKey(userId, 'attempts'), []) : [])
    setWeak([]); setGrade('12'); setSubject('Physical Science'); setSelectedSubjectIds(['physical-science']); setCatalogueSearch(''); setAllSubjectsOpen(false); setExamDate(dateAfterDays(20))
    setOnboarded(false); setShowOnboarding(true)
    if (!userId || !supabase) return
    const client = supabase
    let active = true
    ;(async () => {
      const { data: profile, error: profileError } = await client.from('profiles')
        .select('grade,exam_date,primary_subject,weak_topics').eq('id', userId).maybeSingle()
      if (!active) return
      if (profileError) { console.error('Profile load failed:', profileError.message); return }
      const { data: subjectRows, error: subjectsError } = await client.from('learner_subjects')
        .select('subject_id').eq('user_id', userId).order('created_at', { ascending: true })
      if (!active) return
      const subjectTableUnavailable = subjectsError?.code === '42P01' || subjectsError?.code === 'PGRST205'
      if (subjectsError && !subjectTableUnavailable) {
        console.error('Subject library load failed:', subjectsError.message)
        setToast('Could not load your saved subjects. Please refresh and try again.')
        return
      }
      if (subjectTableUnavailable) console.info('Learner subject migration is not installed yet; using the legacy profile subject until it is applied.')
      const remoteSubjectIds = (subjectRows ?? []).map(row => row.subject_id as string)
      if (profile) {
        const p: Profile = { grade: String(profile.grade ?? '12'), examDate: profile.exam_date ?? dateAfterDays(20), subject: profile.primary_subject ?? 'Physical Science', weak: profile.weak_topics ?? [] }
        setGrade(p.grade); setExamDate(p.examDate); setSubject(p.subject); setWeak(p.weak)
        const ids = remoteSubjectIds.length ? remoteSubjectIds : [p.subject === 'Mathematics' ? 'mathematics' : 'physical-science']
        setSelectedSubjectIds(ids)
        save(userStorageKey(userId, 'subjects'), ids)
        setOnboarded(true); setShowOnboarding(false)
        save(userStorageKey(userId, 'profile'), p)
      } else {
        const localProfile = load<Profile | null>(userStorageKey(userId, 'profile'), null)
        if (localProfile) {
          setGrade(localProfile.grade); setExamDate(localProfile.examDate); setSubject(localProfile.subject); setWeak(localProfile.weak)
          setSelectedSubjectIds(remoteSubjectIds.length ? remoteSubjectIds : [localProfile.subject === 'Mathematics' ? 'mathematics' : 'physical-science'])
          setOnboarded(true); setShowOnboarding(false)
        }
      }
      const { data: rows, error: sessionsError } = await client.from('study_sessions')
        .select('id,subject,subject_id,grade,status,session_state,score,total_questions,duration_seconds,completed_at,started_at,last_activity_at')
        .eq('user_id', userId).order('last_activity_at', { ascending: false }).limit(120)
      if (!active) return
      if (!sessionsError && rows) {
        const completed = rows.filter(r => r.status === 'completed' && r.completed_at)
        setRemoteDates(completed.map(r => localDate(new Date(r.completed_at as string))))
        setSessions(completed.map(r => ({ date: localDate(new Date(r.completed_at as string)), score: Number(r.score ?? 0), seconds: Number(r.duration_seconds ?? 0), subject: String(r.subject) })))
        const inProgress = rows.find(r => r.status === 'in_progress' && r.session_state)
        if (inProgress) {
          const snapshot = inProgress.session_state as unknown as SessionSnapshot
          setRecoverableSession({ ...snapshot, id: String(inProgress.id), seconds: Number(inProgress.duration_seconds ?? snapshot.seconds ?? 0) })
          save(userStorageKey(userId, 'active-session'), { ...snapshot, id: String(inProgress.id) })
        } else {
          setRecoverableSession(null)
          localStorage.removeItem(userStorageKey(userId, 'active-session'))
        }
      }
      const { data: attemptRows, error: attemptsError } = await client.from('question_attempts')
        .select('topic,is_correct,attempted_at,study_session_id,question_id,response')
        .eq('user_id', userId).order('attempted_at', { ascending: true }).limit(500)
      if (active && !attemptsError && attemptRows) {
        setAttempts(attemptRows.map(row => ({
          topic: String(row.topic), correct: Boolean(row.is_correct), t: new Date(row.attempted_at as string).getTime(),
          sessionId: row.study_session_id ? String(row.study_session_id) : undefined,
          questionId: row.question_id ? String(row.question_id) : undefined,
          response: row.response as { selected: number } | undefined,
        })))
      }
    })()
    return () => { active = false }
  }, [user?.id])

  async function signIn() {
    if (!supabase) { setToast('Add your Supabase URL and publishable key to .env.local first.'); return }
    if (!userEmail.includes('@')) { setToast('Enter a valid email address.'); return }
    if (password.length < 8) { setToast('Password must be at least 8 characters.'); return }
    const result = authMode === 'up' ? await supabase.auth.signUp({ email: userEmail, password }) : await supabase.auth.signInWithPassword({ email: userEmail, password })
    if (result.error) { setToast(result.error.message); return }
    // Only seed a new account. Existing accounts retain their saved profile and subjects.
    let limitedSubjectSync = false
    if (result.data.user && result.data.session) {
      let shouldSeed = authMode === 'up'
      if (authMode === 'in') {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', result.data.user.id).maybeSingle()
        shouldSeed = !existing
      }
      if (shouldSeed) {
        // If email confirmation delayed the first save, adopt the guest setup only
        // when this account has no profile. Existing accounts are never overwritten.
        const guestProfile = load<Profile | null>(userStorageKey(null, 'profile'), null)
        const guestSubjects = load<string[]>(userStorageKey(null, 'subjects'), [])
        const seedProfile = guestProfile ?? { grade, examDate, subject, weak }
        const seedSubjects = guestSubjects.length ? guestSubjects : selectedSubjectIds
        const legacySubject = seedSubjects.includes('mathematics') ? 'Mathematics' : seedProfile.subject
        const { error: seedError } = await supabase.rpc('save_learner_onboarding', {
          p_grade: Number(seedProfile.grade), p_exam_date: seedProfile.examDate || null,
          p_primary_subject: legacySubject, p_weak_topics: seedProfile.weak,
          p_subject_ids: seedSubjects,
        })
        if (seedError) {
          const migrationMissing = seedError.code === 'PGRST202' || seedError.message.includes('save_learner_onboarding')
          if (!migrationMissing) {
            console.error('Initial onboarding save failed:', seedError.message)
            setToast('Account created, but your study setup could not be saved. Please retry.')
            return
          }
          const { error: legacySaveError } = await supabase.from('profiles').upsert({
            id: result.data.user.id, grade: Number(seedProfile.grade),
            exam_date: seedProfile.examDate || null, primary_subject: legacySubject,
            weak_topics: seedProfile.weak,
          })
          if (legacySaveError) {
            console.error('Legacy profile save failed:', legacySaveError.message)
            setToast('Account created and signed in, but the study profile could not be saved. Please retry in Study settings.')
            setAuthOpen(false); setPassword('')
            return
          }
          limitedSubjectSync = true
        }
        const firstProfile: Profile = { ...seedProfile, subject: legacySubject }
        save(userStorageKey(result.data.user.id, 'profile'), firstProfile)
        save(userStorageKey(result.data.user.id, 'subjects'), seedSubjects)
        setGrade(firstProfile.grade); setExamDate(firstProfile.examDate); setSubject(firstProfile.subject)
        setWeak(firstProfile.weak); setSelectedSubjectIds(seedSubjects)
      }
    }
    setAuthOpen(false); setPassword('')
    setToast(authMode === 'up' ? 'Check your email to confirm your account.' : limitedSubjectSync ? 'Signed in. Main subject saved; full multi-subject sync activates after the learner-library database update.' : 'You are signed in.')
  }
  async function signOut() { setMenuOpen(false); await supabase?.auth.signOut(); setToast('Signed out.') }

  function startRewind() {
    if (rewindDone) return
    if (!hasStarterQuestionBank) { setToast('Question content for this subject is not available yet. You can still keep it in your subject library.'); return }
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
  function toggleEnrolledSubject(item: CapsSubject) {
    if (item.status === 'pathway-parent') return
    setSelectedSubjectIds(current => {
      if (current.includes(item.id)) {
        if (current.length === 1) { setToast('Keep at least one subject selected.'); return current }
        const next = current.filter(id => id !== item.id)
        if (item.id === (subject === 'Mathematics' ? 'mathematics' : 'physical-science')) {
          const replacement = CAPS_SUBJECTS.find(candidate => next.includes(candidate.id))
          if (replacement) { setSubject(replacement.id === 'physical-science' ? 'Physical Science' : replacement.name); setWeak([]) }
        }
        return next
      }
      return [...current, item.id]
    })
  }
  function setDailySubject(id: string) {
    const item = CAPS_SUBJECTS.find(candidate => candidate.id === id)
    if (!item || !selectedSubjectIds.includes(id)) return
    setSubject(item.id === 'physical-science' ? 'Physical Science' : item.name)
    setWeak([])
  }
  async function saveOnboarding() {
    if (!selectedSubjectIds.length) { setToast('Select at least one subject to continue.'); return }
    const legacySubject = selectedSubjectIds.includes('mathematics') ? 'Mathematics' : 'Physical Science'
    const p: Profile = { grade, examDate, subject: legacySubject, weak }
    if (user && supabase) {
      const { error } = await supabase.rpc('save_learner_onboarding', {
        p_grade: Number(grade), p_exam_date: examDate || null,
        p_primary_subject: legacySubject, p_weak_topics: weak,
        p_subject_ids: selectedSubjectIds,
      })
      if (error) {
        const migrationMissing = error.code === 'PGRST202' || error.message.includes('save_learner_onboarding')
        if (!migrationMissing) {
          console.error('Onboarding persistence failed:', error.message)
          setToast('Could not save your study focus. Your choices are still here; please try again.')
          return
        }
        const { error: legacyError } = await supabase.from('profiles').upsert({
          id: user.id, grade: Number(grade), exam_date: examDate || null,
          primary_subject: legacySubject, weak_topics: weak,
        })
        if (legacyError) {
          console.error('Legacy profile persistence failed:', legacyError.message)
          setToast('Could not save your study focus. Your choices are still here; please try again.')
          return
        }
        save(userStorageKey(user.id, 'profile'), p)
        save(userStorageKey(user.id, 'subjects'), selectedSubjectIds)
        setOnboarded(true); setShowOnboarding(false)
        setToast('Main subject saved to your account. Multi-subject sync will activate after the learner-library database update.')
        return
      }
      save(userStorageKey(user.id, 'profile'), p)
      save(userStorageKey(user.id, 'subjects'), selectedSubjectIds)
    } else {
      save(userStorageKey(null, 'profile'), p)
      save(userStorageKey(null, 'subjects'), selectedSubjectIds)
    }
    setOnboarded(true); setShowOnboarding(false)
    setToast('Your study focus is saved. Rewind first.')
  }

  if (showOnboarding) return <div className="onboard-wrap"><div className="brand"><span className="brand-mark"><Flame size={29} fill="currentColor"/></span><span>Exam<span>Forge</span></span></div><div className="onboard-hero"><p className="eyebrow">STUDY. PRACTICE. EXCEL.</p><h1>Set up your<br/><em>exam focus</em></h1><p className="muted">We’ll tailor your practice to what matters most.</p></div><section className="panel onboarding"><label className="field-label" htmlFor="exam-date"><CalendarDays size={18}/> Exam date</label><input id="exam-date" type="date" min={today} value={examDate} onChange={e=>setExamDate(e.target.value)}/><label className="field-label"><UserRound size={18}/> Your grade</label><div className="choice-row">{['10','11','12'].map(g=><button key={g} className={`choice ${grade===g?'chosen':''}`} onClick={()=>setGrade(g)}>Grade {g}</button>)}</div><label className="field-label"><Settings2 size={18}/> Choose your subjects</label><p className="hint">Select as many CAPS subjects as you want. There is no ExamForge selection limit. You can change your choices later.</p><div className="selected-subjects" aria-live="polite"><b>{selectedSubjectIds.length} selected</b>{enrolledSubjects.map(item=><button type="button" className="selected-subject-chip" key={item.id} onClick={()=>toggleEnrolledSubject(item)} aria-label={`Remove ${item.name}`}>{item.name}<X size={13}/></button>)}</div><label className="catalogue-search"><Search size={17}/><input value={catalogueSearch} onChange={e=>setCatalogueSearch(e.target.value)} placeholder="Search the CAPS subject library" aria-label="Search CAPS subjects"/></label><div className="catalogue-grid">{catalogueResults.map(item=><button type="button" key={item.id} className={`catalogue-option ${selectedSubjectIds.includes(item.id)?'chosen':''}`} onClick={()=>toggleEnrolledSubject(item)} aria-pressed={selectedSubjectIds.includes(item.id)}><span>{item.name}</span><small>{item.status==='caps-index-only'?'CAPS index · ATP availability unverified':item.status==='specialist-atp'?'Specialist ATP offering':'ATP-listed'}</small></button>)}</div><label className="daily-subject-picker">First study focus<select aria-label="Choose your first study focus" value={activeSubjectId} onChange={e=>setDailySubject(e.target.value)}>{enrolledSubjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{hasStarterQuestionBank?<><label className="field-label"><Target size={18}/> Your weakest topics</label><div className="topic-pills">{topics.map(t=><button key={t} onClick={()=>toggleTopic(t)} className={`pill ${weak.includes(t)?'selected':''}`}>{t}</button>)}</div><p className="hint">Choose at least 2 topics. You can change this anytime.</p></>:<p className="content-notice">Topic targeting and question practice will appear here as this subject’s verified learning content is built.</p>}<Button variant="primary" className="primary full" disabled={(hasStarterQuestionBank && weak.length<2) || !examDate || !selectedSubjectIds.length} onClick={saveOnboarding}>Start Forging <ChevronRight size={20}/></Button><p className="privacy"><LockKeyhole size={14}/> Your data stays private. Focus built for you.</p></section></div>

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Flame size={28} fill="currentColor"/></span><span>Exam<span>Forge</span><small>Study. Practice. Excel.</small></span></div><div className="top-actions"><span className={`connection ${isSupabaseConfigured?'online':''}`} title={isSupabaseConfigured?(user?'Signed in':'Supabase configured — not signed in'):'Demo mode'}></span><button type="button" className="icon-btn" onClick={()=>setTheme(value=>{const next=value==='dark'?'light':'dark';save('ef:theme',next);return next})} aria-label={`Switch to ${theme==='dark'?'light':'dark'} theme`} title={`Switch to ${theme==='dark'?'light':'dark'} theme`}>{theme==='dark'?<Sun/>:<Moon/>}</button><button ref={menuButtonRef} className="icon-btn" onClick={()=>setMenuOpen(v=>!v)} aria-label="Menu" aria-expanded={menuOpen}><Menu/></button></div></header>
    {menuOpen && <div className="menu-pop">{user && <div className="who">{user.email}</div>}<button onClick={()=>{setShowOnboarding(true);setMenuOpen(false)}}><Settings2 size={16}/> Study settings</button>{!user && <button onClick={()=>{setAuthOpen(true);setMenuOpen(false)}}><UserRound size={16}/> Account / sign in</button>}{user && <button onClick={signOut}><LogOut size={16}/> Sign out</button>}</div>}
    <main className="main-content">
      {tab==='Dashboard' && <>
        <div className="welcome-row"><div><p className="eyebrow">YOUR DAILY STUDY SYSTEM</p><h1>Tonight’s <em>20.</em></h1><p className="muted">No guessing. Do the work that moves your mark.</p></div><div className="countdown"><strong>{daysLeft ?? '—'}</strong><span>days left</span></div></div>
        <section className="stat-strip"><div><span>🔥 Streak</span><b>{streak} day{streak===1?'':'s'}</b></div><div><span><Target size={14}/> Weakest topic</span><b>{weak[0] || 'Choose topics'}</b></div><div><span><FileText size={14}/> Rewinds done</span><b>{doneDates.length}</b></div></section>
        <section className="tonight-card"><div className="card-top"><span className="section-kicker"><Flame size={17} fill="currentColor"/> TONIGHT’S 20</span><span className="tag-orange">{rewindDone?'Completed':'Daily mission'}</span></div><h2>{rewindDone?'You showed up. That counts.':'Rewind first. Then we move.'}</h2><p className="muted">{rewindDone?'Your session is complete. Come back tomorrow to keep the streak alive.':'5 targeted questions · 7 minutes · weak topics first. No skipping.'}</p><div className="mission-progress"><span style={{width:`${rewindDone?100:0}%`}}/></div><div className="mission-meta"><span>{rewindDone?`Score: ${todaySession?`${todaySession.score}/5`:'done'}`:'5 questions'}</span><span><Clock3 size={14}/> {rewindDone&&todaySession?fmt(todaySession.seconds):'7:00'} {rewindDone?'active':'target'}</span></div><Button variant="primary" className="primary full" disabled={rewindDone} onClick={startRewind}>{rewindDone?'Done for tonight ✓':'Start 7-minute Rewind'} {!rewindDone&&<ChevronRight size={19}/>}</Button></section>
        <section className="dashboard-subjects"><div className="section-heading"><div><h2>Your subjects</h2><p className="muted">Seven dashboard positions. Your full library stays available below.</p></div><button className="text-btn" onClick={()=>setShowOnboarding(true)}>Manage</button></div><label className="daily-subject-picker">Study today<select aria-label="Choose today's study subject" value={activeSubjectId} onChange={e=>setDailySubject(e.target.value)}>{enrolledSubjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="dashboard-subject-grid">{Array.from({length:7},(_,index)=>{const item=dashboardSubjects[index];return <div className={`dashboard-subject-slot ${item?'filled':'empty'}`} key={item?.id ?? `slot-${index+1}`}>{item?<><b>{item.name}</b><small>{['mathematics','physical-science'].includes(item.id)?'Starter question bank available':'Subject selected · learning content in progress'}</small><button type="button" onClick={()=>setDailySubject(item.id)}>Study today</button></>:<><b>Subject slot {index+1}</b><small>Choose another subject in Manage</small></>}</div>})}</div><div className="all-subjects-toggle"><button type="button" className="text-btn" aria-expanded={allSubjectsOpen} onClick={()=>setAllSubjectsOpen(open=>!open)}>{allSubjectsOpen?'Hide all subjects':'All subjects'} ({CAPS_SUBJECTS.filter(item=>item.status!=='pathway-parent').length}) <span>{allSubjectsOpen?'−':'+'}</span></button></div>{allSubjectsOpen&&<div className="all-subjects-panel"><label className="catalogue-search"><Search size={17}/><input value={catalogueSearch} onChange={e=>setCatalogueSearch(e.target.value)} placeholder="Search all CAPS subjects" aria-label="Search all subjects"/></label><div className="all-subjects-list">{catalogueResults.map(item=><div className="all-subject-row" key={item.id}><div><b>{item.name}</b><small>{item.status==='caps-index-only'?'CAPS index only — current ATP mapping not confirmed':item.status==='specialist-atp'?'Specialist ATP offering':'ATP-listed'}</small></div><button type="button" onClick={()=>toggleEnrolledSubject(item)}>{selectedSubjectIds.includes(item.id)?'Selected':'Add'}</button></div>)}</div></div>}</section><div className="section-heading"><div><h2>Today’s prescribed work</h2><p className="muted">One specific task. Finish it properly.</p></div><span className="tag">Roadmap</span></div>
        <section className={`task-card ${rewindDone?'':'locked'}`}><div className="task-icon">{rewindDone?<Atom/>:<LockKeyhole/>}</div><div className="task-copy"><b>{subject==='Physical Science'||subject==='Physical Sciences'?'Q2 · Inclined plane':subject==='Mathematics'?'Q3 · Quadratic functions':'Learning content coming soon'}</b><p>{['Physical Science','Physical Sciences','Mathematics'].includes(subject)?'2025 DBE Trial · Paper 1 (sample task)':'CAPS subject library · roadmap not yet published'}</p><small>{rewindDone?(subject==='Physical Science'?'Draw a free-body diagram. Show N = mg cos θ.':'Complete the sketch and identify the turning point.'):'Locked until you finish tonight’s Rewind.'}</small></div><button className="round-arrow" disabled={!rewindDone} aria-label="Open past papers" onClick={()=>setTab('Past Papers')}><ChevronRight/></button></section>
        <div className="section-heading"><div><h2>Your focus</h2><p className="muted">Work on these before exam day.</p></div><button className="text-btn" onClick={()=>setShowOnboarding(true)}>Edit</button></div><div className="topic-pills dashboard-pills">{weak.map(t=><span className="pill selected" key={t}>{t}</span>)}</div>
      </>}
      {tab==='Past Papers' && <><div className="page-heading"><p className="eyebrow">PRACTISE THE REAL THING</p><h1>Past Papers</h1><p className="muted">Attempt. Mark. Learn from every mistake.</p></div><div className="searchbox"><Search size={18}/><input placeholder="Search past papers…" value={search} onChange={e=>setSearch(e.target.value)}/><Settings2 size={18}/></div><div className="filter-row">{['All','Physical Science','Mathematics','2025','2024'].map(f=><button className={`filter ${filter===f?'active':''}`} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div><h3 className="subheading">{filteredPapers.length} sample listings</h3><div className="paper-list">{filteredPapers.map((p,i)=><article className="paper-card" key={p.title}><div className={`paper-symbol sym-${i%3}`}>{p.title.includes('Mathematics')?<Sigma/>:<Atom/>}</div><div className="paper-main"><div className="paper-title-row"><span className="paper-year">{p.year}</span><div><b>{p.title}</b><small>{p.subtitle}</small></div></div><div className="paper-tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="paper-action"><small>{p.level}</small><span>Sample</span><button className="small-primary" disabled>Coming soon</button></div></article>)}</div><p className="hint">Sample listings only. Real paper files and official memos will be added before launch.</p></>}
      {tab==='Upload Notes' && <><div className="page-heading"><p className="eyebrow purple-text">YOUR NOTES. YOUR QUESTIONS.</p><h1>Upload Notes</h1><p className="muted">Add notes to generate targeted practice questions.</p></div><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={e=>pickNotes(Array.from(e.target.files||[]))}/><div className="upload-icon"><Upload size={30}/></div><b>Take a photo or upload a PDF</b><p>Capture handwritten or printed notes instantly.</p><span className="upload-link">Choose files <Plus size={15}/></span><small>JPG, PNG, WebP or PDF · Max 10 MB per file</small></label>{notes.length>0&&<div className="selected-files">{notes.map((f,i)=><div key={`${f.name}-${i}`}><FileText size={17}/><span>{f.name}</span><button aria-label={`Remove ${f.name}`} onClick={()=>setNotes(a=>a.filter(x=>x!==f))}><X size={16}/></button></div>)}<button className="primary full" onClick={uploadNotes}>Upload {notes.length} file(s) <ChevronRight size={18}/></button></div>}{noteStatus&&<p className="status-message">{noteStatus}</p>}<section className="purple-panel"><div className="purple-icon"><FlaskConical/></div><div><b>What happens next?</b><p>Coming soon: ExamForge will extract your notes, check confidence, and draft questions linked to your weak topics. You review them before they enter Rewind. For now, uploads are stored privately.</p></div></section><div className="section-heading"><div><h2>Recently uploaded</h2><p className="muted">Your study material library</p></div></div><div className="empty-state"><BookOpen size={30}/><b>Nothing to show yet</b><p>Your uploaded pages and generated questions will appear here.</p></div></>}
      {tab==='Progress' && <><div className="page-heading"><p className="eyebrow">HONEST FEEDBACK</p><h1>Your Progress</h1><p className="muted">Track the work, not just the feeling.</p></div><div className="progress-summary"><div><span>Study sessions</span><b>{doneDates.length}</b><div className="bar"><i style={{width:`${Math.min(100,doneDates.length*5)}%`}}/></div></div><div><span>Current streak</span><b>{streak}</b><div className="bar bluebar"><i style={{width:`${Math.min(100,streak*10)}%`}}/></div></div><div><span>Rewind accuracy</span><b>{accuracy===null?'—':`${accuracy}%`}</b><div className="bar"><i style={{width:`${accuracy??0}%`}}/></div></div></div><section className="panel progress-panel"><h3>Topic mastery</h3>{topics.map(t=>{const m=masteryFor(t);return <div className="mastery-row" key={t}><span>{t}</span><b>{m===null?'—':`${m}%`}</b><div className="bar"><i style={{width:`${m??0}%`}}/></div></div>})}</section><section className="panel"><h3>Study activity</h3>{doneDates.length===0?<div className="activity-empty"><Activity size={25}/><p>Complete your first Rewind to start building your activity history.</p></div>:<div className="activity-empty"><Activity size={25}/><p>{doneDates.length} Rewind{doneDates.length===1?'':'s'} completed. Last: {[...doneDates].sort().slice(-1)[0]}.</p></div>}</section><p className="hint">Mastery is based on your last 20 answers per topic. A dash means no answers yet.</p></>}
    </main>
    <Navigation className="bottom-nav" label="Main navigation" items={[
      {href:'#dashboard',label:<><Home size={21}/><span>Dashboard</span></>,current:tab==='Dashboard',onClick:e=>{e.preventDefault();setTab('Dashboard')}},
      {href:'#papers',label:<><FileText size={21}/><span>Past Papers</span></>,current:tab==='Past Papers',onClick:e=>{e.preventDefault();setTab('Past Papers')}},
      {href:'#upload',label:<><Plus size={21}/><span>Upload</span></>,current:tab==='Upload Notes',onClick:e=>{e.preventDefault();setTab('Upload Notes')}},
      {href:'#progress',label:<><Activity size={21}/><span>Progress</span></>,current:tab==='Progress',onClick:e=>{e.preventDefault();setTab('Progress')}}
    ]} />
    {rewindOpen && currentQuestion && <div className="rewind-overlay"><header className="rewind-head"><span style={{width:36}}/><b>ExamForge <span>/ Rewind {questionIndex+1}/{sessionQs.length}</span></b><strong><Clock3 size={17}/> {fmt(Math.max(0,REWIND_SECONDS-seconds))}</strong></header><div className="rewind-body"><div className="rewind-label"><Flame size={18} fill="currentColor"/> FULL-SCREEN REWIND</div><div className="question-card"><span className="question-source">{subject} · {currentQuestion.topic}</span><h2>{currentQuestion.prompt}</h2><div className="answer-list">{currentQuestion.options.map((o,i)=><button key={o} className={`answer-option ${selected===i?'picked':''} ${selected!==null&&i===currentQuestion.answer?'correct':''} ${selected===i&&i!==currentQuestion.answer?'incorrect':''}`} onClick={()=>chooseAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{o}{selected!==null&&i===currentQuestion.answer&&<Check className="answer-check"/>}</button>)}</div>{selected!==null&&<div className="explanation"><b>{selected===currentQuestion.answer?'Correct.':'Not quite. Learn the method.'}</b><p>{currentQuestion.explanation}</p></div>}</div><button className="primary full submit-answer" disabled={selected===null} onClick={nextQuestion}>{questionIndex>=sessionQs.length-1?'Finish Rewind':'Next question'} <ChevronRight/></button><p className="privacy"><ShieldCheck size={15}/> Active time only — the timer pauses if you leave the app</p></div></div>}
    {authOpen&&<Dialog open={authOpen} onOpenChange={(open)=>{setAuthOpen(open);if(!open){setMenuOpen(false);window.requestAnimationFrame(()=>menuButtonRef.current?.focus())}}} title={authMode==='up'?'Create your account':'Welcome back'} description="Your progress follows you across devices." className="auth-dialog">
      <div className="brand"><span className="brand-mark"><Flame fill="currentColor"/></span><span>Exam<span>Forge</span></span></div>
      <div className="auth-form">
        <TextField label="Email address" type="email" autoComplete="email" value={userEmail} onChange={e=>setUserEmail(e.target.value)} placeholder="you@example.com" required />
        <TextField label="Password" type="password" autoComplete={authMode==='up'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
        <Button variant="primary" className="primary full" onClick={signIn}>{authMode==='up'?'Create account':'Sign in'}</Button>
        <button className="text-btn centered" type="button" onClick={()=>setAuthMode(m=>m==='up'?'in':'up')}>{authMode==='up'?'Already have an account? Sign in':'New to ExamForge? Create account'}</button>
      </div>
    </Dialog>}
    {toast&&<div className="toast">{toast}</div>}
  </div>
}
export default App
