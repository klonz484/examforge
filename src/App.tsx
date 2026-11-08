import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Atom, BookOpen, CalendarDays, Check, ChevronRight, Clock3, FileText, Flame, FlaskConical, Home, LockKeyhole, LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Sigma, Sun, Moon, Target, Upload, UserRound, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'
import { Button, Dialog, Navigation, TextField } from './components/ui'
import { CAPS_SUBJECTS, searchCapsSubjects, type CapsSubject } from './data/capsSubjects'
import { getPracticeTopics, PRACTICE_QUESTIONS, selectPracticeQuestions, type PracticeQuestion } from './data/practiceQuestions'
import { CAPS_ROADMAPS } from './data/capsRoadmaps'
import { OFFICIAL_PAPER_ARCHIVES } from './data/examArchives'
import { isFlashcardDue, scheduleFlashcardReview, type FlashcardReviewState, type ReviewGrade } from './data/spacedRepetition'
import { analyseProgress } from './data/progressIntelligence'

type Tab = 'Dashboard' | 'Past Papers' | 'Upload Notes' | 'Progress'
const REWIND_SECONDS = 20 * 60
const ALLOWED_NOTE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_NOTE_BYTES = 10 * 1024 * 1024

type Session = { date: string; score: number; seconds: number; subject: string }
type Attempt = { topic: string; correct: boolean; t: number; sessionId?: string; questionId?: string; response?: { selected: number } }
type SessionSnapshot = { id?: string; updatedAt?: string; subject: string; subjectId: string; grade: number; questions: PracticeQuestion[]; questionIndex: number; answers: number[]; seconds: number; startedAt: string }
type SessionSummary = { session: Session; questions: PracticeQuestion[]; answers: number[] }
type Profile = { grade: string; examDate: string; subject: string; weak: string[] }
type AIStudyDraft = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
  grade: number
  subjectId: string
  subjectName: string
  topic: string
  confidence: number
  sourceLabel: string
  provenance: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
}

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
  const [flashcardReviews, setFlashcardReviews] = useState<Record<string, FlashcardReviewState>>({})
  const [mistakeSearch, setMistakeSearch] = useState('')
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [flashcardRevealed, setFlashcardRevealed] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [roadmapGrade, setRoadmapGrade] = useState('12')
  const [roadmapSubjectId, setRoadmapSubjectId] = useState<'mathematics' | 'physical-science'>('mathematics')
  const [notes, setNotes] = useState<File[]>([])
  const [noteStatus, setNoteStatus] = useState('')
  const [aiSourceText, setAiSourceText] = useState('')
  const [aiGenerationStatus, setAiGenerationStatus] = useState('')
  const [aiDraft, setAiDraft] = useState<AIStudyDraft | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
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
  const enrolledSubjects = selectedSubjectIds.map(id => CAPS_SUBJECTS.find(item => item.id === id)).filter((item): item is CapsSubject => Boolean(item))
  const dashboardSubjects = enrolledSubjects.slice(0, 7)
  const catalogueResults = searchCapsSubjects(catalogueSearch, Number(grade) as 10 | 11 | 12).filter(item => item.status !== 'pathway-parent')
  const activeSubjectId = enrolledSubjects.find(item => item.name === subject || (item.id === 'physical-science' && (subject === 'Physical Science' || subject === 'Physical Sciences')))?.id ?? selectedSubjectIds[0] ?? 'physical-science'
  const topics = getPracticeTopics(activeSubjectId, Number(grade))
  const hasStarterQuestionBank = topics.length > 0
  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate + 'T23:59:59').getTime() - Date.now()) / 86400000)) : null
  const currentQuestion = sessionQs[questionIndex]
  const score = answers.reduce((n, a, i) => n + (sessionQs[i] && a === sessionQs[i].answer ? 1 : 0), 0)
  const filteredArchives = useMemo(() => OFFICIAL_PAPER_ARCHIVES.filter(item =>
    (filter === 'All' || (filter === 'Physical Science' ? item.subjectId === 'physical-science' : filter === 'Mathematics' ? item.subjectId === 'mathematics' : String(item.year) === filter)) &&
    (item.subjectName + item.year + item.sitting + item.sourceTitle).toLowerCase().includes(search.toLowerCase())
  ), [filter, search])
  const activeRoadmap = CAPS_ROADMAPS.find(item => item.grade === Number(roadmapGrade) && item.subjectId === roadmapSubjectId) ?? null
  const subjectAttempts = attempts.filter(a => topics.includes(a.topic))
  const masteryFor = (t: string) => { const rows = attempts.filter(a => a.topic === t).slice(-20); return rows.length ? Math.round(100 * rows.filter(r => r.correct).length / rows.length) : null }
  const accuracy = subjectAttempts.length ? Math.round(100 * subjectAttempts.filter(a => a.correct).length / subjectAttempts.length) : null
  const mistakeQuestions = useMemo(() => {
    const ids = Array.from(new Set(attempts.filter(item => !item.correct && item.questionId).map(item => item.questionId!)))
    return ids.map(id => PRACTICE_QUESTIONS.find(question => question.id === id)).filter((item): item is PracticeQuestion => Boolean(item))
      .filter(question => (question.prompt + question.topic).toLowerCase().includes(mistakeSearch.toLowerCase()))
  }, [attempts, mistakeSearch])
  const dueMistakeCount = mistakeQuestions.filter(question => isFlashcardDue(flashcardReviews[question.id])).length
  const progressInsight = analyseProgress(subjectAttempts, topics)

  // Rewind timer: counts active, visible time only.
  useEffect(() => {
    if (!rewindOpen) return
    const id = window.setInterval(() => { if (!document.hidden) setSeconds(x => x + 1) }, 1000)
    return () => window.clearInterval(id)
  }, [rewindOpen])

  // Keep an account-scoped local recovery copy current, including guest sessions.
  useEffect(() => {
    if (!sessionQs.length || !sessionStartedAt || (!rewindOpen && !recoverableSession)) return
    const snapshot: SessionSnapshot = {
      id: activeSessionId ?? undefined, subject, subjectId: activeSubjectId,
      grade: Number(grade), questions: sessionQs, questionIndex, answers, seconds, startedAt: sessionStartedAt, updatedAt: new Date().toISOString(),
    }
    save(userStorageKey(user?.id ?? null, 'active-session'), snapshot)
  }, [activeSessionId, activeSubjectId, answers, grade, questionIndex, recoverableSession, rewindOpen, seconds, sessionQs, sessionStartedAt, subject, user?.id])
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
    setSessions(load<Session[]>(userStorageKey(userId, 'sessions'), []))
    setAttempts(load<Attempt[]>(userStorageKey(userId, 'attempts'), []))
    setFlashcardReviews(load<Record<string, FlashcardReviewState>>(userStorageKey(userId, 'flashcard-reviews'), {}))
    setMistakeSearch(''); setActiveReviewId(null); setFlashcardRevealed(false)
    setWeak([]); setGrade('12'); setSubject('Physical Science'); setSelectedSubjectIds(['physical-science']); setCatalogueSearch(''); setAllSubjectsOpen(false); setExamDate(dateAfterDays(20))
    setOnboarded(false); setShowOnboarding(true)
    if (!userId) {
      const guestProfile = load<Profile | null>(userStorageKey(null, 'profile'), null)
      const guestSubjects = load<string[]>(userStorageKey(null, 'subjects'), [])
      if (guestProfile) {
        setGrade(guestProfile.grade); setExamDate(guestProfile.examDate); setSubject(guestProfile.subject); setWeak(guestProfile.weak)
        setSelectedSubjectIds(guestSubjects.length ? guestSubjects : [guestProfile.subject === 'Mathematics' ? 'mathematics' : 'physical-science'])
        setOnboarded(true); setShowOnboarding(false)
      }
      return
    }
    if (!supabase) return
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
          const remoteSnapshot = inProgress.session_state as unknown as SessionSnapshot
          const localSnapshot = load<SessionSnapshot | null>(userStorageKey(userId, 'active-session'), null)
          const remoteUpdated = new Date(String(inProgress.last_activity_at)).getTime()
          const localUpdated = localSnapshot?.id === String(inProgress.id) ? new Date(localSnapshot.updatedAt ?? 0).getTime() : 0
          const snapshot = localUpdated > remoteUpdated ? localSnapshot! : { ...remoteSnapshot, id: String(inProgress.id), seconds: Number(inProgress.duration_seconds ?? remoteSnapshot.seconds ?? 0) }
          setRecoverableSession(snapshot)
          save(userStorageKey(userId, 'active-session'), snapshot)
        } else {
          setRecoverableSession(null)
          localStorage.removeItem(userStorageKey(userId, 'active-session'))
        }
      }
      const { data: attemptRows, error: attemptsError } = await client.from('question_attempts')
        .select('topic,is_correct,attempted_at,study_session_id,question_id,response')
        .eq('user_id', userId).order('attempted_at', { ascending: false }).limit(500)
      if (active && !attemptsError && attemptRows) {
        const hydratedAttempts = [...attemptRows].reverse().map(row => ({
          topic: String(row.topic), correct: Boolean(row.is_correct), t: new Date(row.attempted_at as string).getTime(),
          sessionId: row.study_session_id ? String(row.study_session_id) : undefined,
          questionId: row.question_id ? String(row.question_id) : undefined,
          response: row.response as { selected: number } | undefined,
        }))
        setAttempts(hydratedAttempts)
        save(userStorageKey(userId, 'attempts'), hydratedAttempts)
      }
      const { data: reviewRows, error: reviewError } = await client.from('flashcard_reviews')
        .select('question_id,interval_days,ease_factor,repetitions,last_grade,last_reviewed_at,next_review_at,updated_at')
        .eq('user_id', userId)
      if (!active) return
      const reviewTableMissing = reviewError?.code === '42P01' || reviewError?.code === 'PGRST205'
      if (reviewError && !reviewTableMissing) {
        console.error('Flashcard review sync failed:', reviewError.message)
        setToast('Could not load your saved review schedule. Local mistakes are still available.')
      } else if (!reviewError && reviewRows) {
        const byId = Object.fromEntries(reviewRows.map(row => [String(row.question_id), {
          question_id: String(row.question_id),
          interval_days: Number(row.interval_days),
          ease_factor: Number(row.ease_factor),
          repetitions: Number(row.repetitions),
          last_grade: row.last_grade == null ? null : Number(row.last_grade) as ReviewGrade,
          last_reviewed_at: row.last_reviewed_at as string | null,
          next_review_at: String(row.next_review_at),
          updated_at: String(row.updated_at),
        }])) as Record<string, FlashcardReviewState>
        setFlashcardReviews(byId)
        save(userStorageKey(userId, 'flashcard-reviews'), byId)
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

  function makeSessionSnapshot(overrides: Partial<SessionSnapshot> = {}): SessionSnapshot | null {
    if (!sessionQs.length) return null
    return {
      id: activeSessionId ?? undefined,
      subject,
      subjectId: activeSubjectId,
      grade: Number(grade),
      questions: sessionQs,
      questionIndex,
      answers,
      seconds,
      startedAt: sessionStartedAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
      ...overrides,
    }
  }
  function resumeRewind(snapshot: SessionSnapshot) {
    setSubject(snapshot.subject); setSessionQs(snapshot.questions); setQuestionIndex(snapshot.questionIndex)
    setAnswers(snapshot.answers); setSelected(snapshot.answers[snapshot.questionIndex] ?? null)
    setSeconds(snapshot.seconds); setSessionStartedAt(snapshot.startedAt); setActiveSessionId(snapshot.id ?? null)
    setRecoverableSession(snapshot); setRewindOpen(true)
  }
  async function startRewind() {
    if (rewindDone) return
    if (recoverableSession) { resumeRewind(recoverableSession); return }
    const questions = selectPracticeQuestions(activeSubjectId, Number(grade), weak, 5)
    if (!questions.length) {
      setToast(`Verified starter questions are not available for ${subject}, Grade ${grade}, yet. Your subject remains in your library.`)
      return
    }
    const startedAt = new Date().toISOString()
    const initial: SessionSnapshot = {
      subject, subjectId: activeSubjectId, grade: Number(grade), questions,
      questionIndex: 0, answers: [], seconds: 0, startedAt,
    }
    let sessionId: string | undefined
    if (user && supabase) {
      const { data, error } = await supabase.from('study_sessions').insert({
        subject, subject_id: activeSubjectId, grade: Number(grade), session_type: 'practice',
        status: 'in_progress', duration_seconds: 0, score: null, total_questions: questions.length,
        source_label: questions[0].sourceLabel, session_state: initial,
        started_at: startedAt, last_activity_at: startedAt, completed_at: null,
      }).select('id').single()
      if (error || !data?.id) {
        console.error('Could not start study session:', error?.message)
        setToast('Your session could not be started on your account. Check your connection and try again.')
        return
      }
      sessionId = data.id
    }
    const snapshot = { ...initial, id: sessionId }
    save(userStorageKey(user?.id ?? null, 'active-session'), snapshot)
    setActiveSessionId(sessionId ?? null); setSessionStartedAt(startedAt)
    setSessionQs(questions); setQuestionIndex(0); setSelected(null); setAnswers([]); setSeconds(0)
    setRecoverableSession(snapshot); setSessionSummary(null); setRewindOpen(true)
  }
  async function finishRewind() {
    const finalScore = answers.reduce((n, answer, index) => n + (sessionQs[index] && answer === sessionQs[index].answer ? 1 : 0), 0)
    const finalSnapshot = makeSessionSnapshot({ seconds, answers })
    if (!finalSnapshot) return
    if (user && supabase) {
      if (!activeSessionId) { setToast('This session has no saved account record. Keep it open and retry.'); return }
      const { error } = await supabase.rpc('complete_study_session', {
        p_session_id: activeSessionId, p_session_state: { ...finalSnapshot, completed: true },
        p_duration_seconds: seconds, p_score: finalScore, p_total_questions: sessionQs.length,
      })
      if (error) {
        // A network interruption can hide a successful server commit. Confirm before asking the learner to retry.
        const { data: persisted } = await supabase.from('study_sessions').select('status').eq('id', activeSessionId).maybeSingle()
        if (persisted?.status !== 'completed') {
          console.error('Session completion sync failed:', error.message)
          save(userStorageKey(user.id, 'active-session'), finalSnapshot)
          setToast('Your answers are safe on this device, but completion could not sync. Keep this session open and retry.')
          return
        }
      }
    }
    const entry: Session = { date: today, score: finalScore, seconds, subject }
    const next = [...sessions.filter(item => item.date !== today), entry]
    setSessions(next); save(userStorageKey(user?.id ?? null, 'sessions'), next)
    setRemoteDates(d => Array.from(new Set([...d, today])))
    localStorage.removeItem(userStorageKey(user?.id ?? null, 'active-session'))
    setRecoverableSession(null); setRewindOpen(false); setActiveSessionId(null)
    setSessionSummary({ session: entry, questions: sessionQs, answers })
    setToast(`Tonight’s 20 complete: ${finalScore}/${sessionQs.length} correct.`)
  }
  async function chooseAnswer(i: number) {
    if (selected !== null || !currentQuestion) return
    const correct = i === currentQuestion.answer
    const nextAnswers = [...answers.slice(0, questionIndex), i]
    const snapshot = makeSessionSnapshot({ answers: nextAnswers, seconds })
    if (!snapshot) return
    if (user && supabase) {
      if (!activeSessionId) { setToast('Your session record is missing. Please reopen the saved session.'); return }
      const { error } = await supabase.rpc('record_study_answer', {
        p_session_id: activeSessionId, p_question_id: currentQuestion.id,
        p_topic: currentQuestion.topic, p_question_position: questionIndex,
        p_response: { selected: i }, p_is_correct: correct,
        p_session_state: snapshot, p_duration_seconds: seconds,
      })
      if (error) {
        console.error('Answer persistence failed:', error.message)
        setToast('Answer not synced. Please check your connection and select your answer again before moving on.')
        return
      }
    }
    setSelected(i); setAnswers(nextAnswers)
    const nextAttempts = [...attempts, {
      topic: currentQuestion.topic, correct, t: Date.now(),
      sessionId: activeSessionId ?? undefined, questionId: currentQuestion.id, response: { selected: i },
    }].slice(-500)
    setAttempts(nextAttempts); save(userStorageKey(user?.id ?? null, 'attempts'), nextAttempts)
  }
  async function saveAndExitSession() {
    const snapshot = makeSessionSnapshot()
    if (!snapshot) return
    save(userStorageKey(user?.id ?? null, 'active-session'), snapshot)
    if (user && supabase && activeSessionId) {
      const { error } = await supabase.from('study_sessions').update({
        session_state: snapshot, duration_seconds: seconds, last_activity_at: new Date().toISOString(),
      }).eq('id', activeSessionId).eq('status', 'in_progress')
      if (error) {
        console.error('Session pause sync failed:', error.message)
        setToast('Saved on this device. Cloud sync will retry when you resume.')
      } else setToast('Session saved. You can resume it later.')
    } else setToast('Session saved. You can resume it later.')
    setRecoverableSession(snapshot); setRewindOpen(false)
  }
  async function abandonSession() {
    if (user && supabase && activeSessionId) {
      const { error } = await supabase.from('study_sessions').update({
        status: 'abandoned', session_state: makeSessionSnapshot(), duration_seconds: seconds,
        last_activity_at: new Date().toISOString(),
      }).eq('id', activeSessionId).eq('status', 'in_progress')
      if (error) { setToast('Could not abandon this session yet. Save and exit instead.'); return }
    }
    localStorage.removeItem(userStorageKey(user?.id ?? null, 'active-session'))
    setRecoverableSession(null); setRewindOpen(false); setActiveSessionId(null); setSessionQs([])
    setToast('Session abandoned. Answers already submitted remain in your study history.')
  }
  function nextQuestion() {
    if (questionIndex >= sessionQs.length - 1) { void finishRewind(); return }
    setQuestionIndex(i => i + 1); setSelected(null)
  }

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
  async function generateAIQuestionDraft() {
    if (!supabase) { setAiGenerationStatus('Connect Supabase before using the AI Academy.'); return }
    if (!user) { setAuthOpen(true); setAiGenerationStatus('Sign in to create a private AI question draft.'); return }
    if (aiSourceText.trim().length < 100) { setAiGenerationStatus('Paste at least 100 characters of study text first.'); return }
    if (aiSourceText.length > 8000) { setAiGenerationStatus('Keep the source text under 8,000 characters per draft.'); return }
    if (!activeSubjectId || !topics.length) { setAiGenerationStatus('Choose a subject and grade with an available topic map first.'); return }

    setAiBusy(true); setAiGenerationStatus('Checking your daily allowance and drafting one question securely…')
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-question', {
        body: {
          grade: Number(grade), subjectId: activeSubjectId, subjectName: subject,
          topic: weak[0] ?? topics[0], sourceText: aiSourceText.trim(),
        },
      })
      if (error) {
        let detail = error.message
        try {
          const context = (error as { context?: Response }).context
          if (context) {
            const body = await context.clone().json()
            if (typeof body?.error === 'string') detail = body.error
          }
        } catch { /* keep the provider-safe error text */ }
        setAiGenerationStatus(detail || 'AI drafting is not available right now.')
        return
      }
      if (!data?.id || !Array.isArray(data.options) || data.options.length !== 4 ||
          typeof data.answerIndex !== 'number' || typeof data.prompt !== 'string') {
        setAiGenerationStatus('The server response did not pass the question preview checks. Try again later.')
        return
      }
      const draft: AIStudyDraft = {
        id: String(data.id), prompt: String(data.prompt), options: data.options.map((item: unknown) => String(item)),
        answerIndex: Number(data.answerIndex), explanation: String(data.explanation ?? ''),
        grade: Number(data.grade), subjectId: String(data.subjectId), subjectName: String(data.subjectName),
        topic: String(data.topic), confidence: Number(data.confidence), sourceLabel: String(data.sourceLabel),
        provenance: String(data.provenance), reviewStatus: 'pending',
      }
      setAiDraft(draft)
      setAiGenerationStatus('Draft created. Review the answer and explanation before approving it.')
    } catch (error) {
      console.error('AI draft request failed:', error)
      setAiGenerationStatus('AI drafting failed. Your existing notes and study history are unchanged.')
    } finally {
      setAiBusy(false)
    }
  }

  async function setAIDraftReviewStatus(status: 'approved' | 'rejected') {
    if (!user || !supabase || !aiDraft) { setAiGenerationStatus('Sign in again to review this draft.'); return }
    setAiBusy(true)
    const { data, error } = await supabase.from('generated_questions')
      .update({ review_status: status })
      .eq('id', aiDraft.id).eq('user_id', user.id).select('id').maybeSingle()
    setAiBusy(false)
    if (error || !data?.id) {
      console.error('AI draft review update failed:', error?.message)
      setAiGenerationStatus('Your review decision could not be saved. Please retry.')
      return
    }
    setAiDraft({ ...aiDraft, reviewStatus: status })
    setAiGenerationStatus(status === 'approved'
      ? 'Draft approved and saved to your question library. It is still labelled AI-generated, not official DBE content.'
      : 'Draft rejected. It remains marked rejected in your private question library.')
  }

  async function submitFlashcardGrade(questionId: string, gradeValue: ReviewGrade) {
    const previous = flashcardReviews[questionId]
    if (user && supabase) {
      const { data, error } = await supabase.rpc('review_flashcard', { p_question_id: questionId, p_grade: gradeValue })
      if (error) {
        const migrationMissing = error.code === '42P01' || error.code === 'PGRST202' || error.code === 'PGRST205'
        if (!migrationMissing) {
          console.error('Flashcard review save failed:', error.message)
          setToast('Could not save this review to your account. Please retry.')
          return
        }
        const localState = scheduleFlashcardReview(questionId, previous, gradeValue)
        const next = { ...flashcardReviews, [questionId]: localState }
        setFlashcardReviews(next); save(userStorageKey(user.id, 'flashcard-reviews'), next)
        setToast('Review saved on this device only. Account sync needs the flashcard migration.')
      } else {
        const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
        if (!row) { setToast('The review was not returned by the server. Please retry.'); return }
        const serverState: FlashcardReviewState = {
          question_id: String(row.question_id), interval_days: Number(row.interval_days),
          ease_factor: Number(row.ease_factor), repetitions: Number(row.repetitions),
          last_grade: row.last_grade == null ? null : Number(row.last_grade) as ReviewGrade,
          last_reviewed_at: row.last_reviewed_at as string | null,
          next_review_at: String(row.next_review_at), updated_at: String(row.updated_at),
        }
        const next = { ...flashcardReviews, [questionId]: serverState }
        setFlashcardReviews(next); save(userStorageKey(user.id, 'flashcard-reviews'), next)
        setToast(`Review saved. Next review: ${new Date(serverState.next_review_at).toLocaleDateString()}.`)
      }
    } else {
      const localState = scheduleFlashcardReview(questionId, previous, gradeValue)
      const next = { ...flashcardReviews, [questionId]: localState }
      setFlashcardReviews(next); save(userStorageKey(null, 'flashcard-reviews'), next)
      setToast(`Review saved on this device. Next review: ${new Date(localState.next_review_at).toLocaleDateString()}.`)
    }
    setActiveReviewId(null); setFlashcardRevealed(false)
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
        <section className="stat-strip"><div><span>🔥 Streak</span><b>{streak} day{streak===1?'':'s'}</b></div><div><span><Target size={14}/> Weakest topic</span><b>{weak[0] || 'Choose topics'}</b></div><div><span><FileText size={14}/> Sessions done</span><b>{doneDates.length}</b></div></section>
        <section className="tonight-card"><div className="card-top"><span className="section-kicker"><Flame size={17} fill="currentColor"/> TONIGHT’S 20</span><span className="tag-orange">{rewindDone?'Completed':'Daily mission'}</span></div><h2>{rewindDone?'You showed up. That counts.':'Let’s finish today’s focus.'}</h2><p className="muted">{rewindDone?'Your session is complete. Come back tomorrow to keep the streak alive.':'5 targeted questions · 20-minute focus target · weak topics first. Take the time you need.'}</p><div className="mission-progress"><span style={{width:`${rewindDone?100:0}%`}}/></div><div className="mission-meta"><span>{rewindDone?`Score: ${todaySession?`${todaySession.score}/5`:'done'}`:'5 questions'}</span><span><Clock3 size={14}/> {rewindDone&&todaySession?fmt(todaySession.seconds):'20:00'} {rewindDone?'active':'target'}</span></div><Button variant="primary" className="primary full" disabled={rewindDone} onClick={startRewind}>{rewindDone?'Done for tonight ✓':recoverableSession?'Resume saved session':'Start Tonight’s 20'} {!rewindDone&&<ChevronRight size={19}/>}</Button></section>
        {sessionSummary && <section className="panel session-summary" aria-live="polite">
          <div className="section-heading"><div><h2>Tonight’s 20 complete</h2><p className="muted">{sessionSummary.session.subject} · {fmt(sessionSummary.session.seconds)} active time</p></div><button className="text-btn" onClick={()=>setSessionSummary(null)}>Dismiss</button></div>
          <strong className="session-score">{sessionSummary.session.score}/{sessionSummary.questions.length} correct</strong>
          <p className="muted">Your answers and corrections are saved in your study history. Review missed questions in Progress.</p>
          {sessionSummary.questions.map((question,index)=>sessionSummary.answers[index] !== question.answer ? <article className="mistake-row" key={question.id}><b>{question.topic}</b><p>{question.prompt}</p><small>Your answer: {question.options[sessionSummary.answers[index]] ?? 'Not answered'}</small><p>Correct answer: {question.options[question.answer]}</p><p>{question.explanation}</p></article> : null)}
        </section>}
        <section className="dashboard-subjects"><div className="section-heading"><div><h2>Your subjects</h2><p className="muted">Seven dashboard positions. Your full library stays available below.</p></div><button className="text-btn" onClick={()=>setShowOnboarding(true)}>Manage</button></div><label className="daily-subject-picker">Study today<select aria-label="Choose today's study subject" value={activeSubjectId} onChange={e=>setDailySubject(e.target.value)}>{enrolledSubjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="dashboard-subject-grid">{Array.from({length:7},(_,index)=>{const item=dashboardSubjects[index];return <div className={`dashboard-subject-slot ${item?'filled':'empty'}`} key={item?.id ?? `slot-${index+1}`}>{item?<><b>{item.name}</b><small>{['mathematics','physical-science'].includes(item.id)?'Starter question bank available':'Subject selected · learning content in progress'}</small><button type="button" onClick={()=>setDailySubject(item.id)}>Study today</button></>:<><b>Subject slot {index+1}</b><small>Choose another subject in Manage</small></>}</div>})}</div><div className="all-subjects-toggle"><button type="button" className="text-btn" aria-expanded={allSubjectsOpen} onClick={()=>setAllSubjectsOpen(open=>!open)}>{allSubjectsOpen?'Hide all subjects':'All subjects'} ({CAPS_SUBJECTS.filter(item=>item.status!=='pathway-parent').length}) <span>{allSubjectsOpen?'−':'+'}</span></button></div>{allSubjectsOpen&&<div className="all-subjects-panel"><label className="catalogue-search"><Search size={17}/><input value={catalogueSearch} onChange={e=>setCatalogueSearch(e.target.value)} placeholder="Search all CAPS subjects" aria-label="Search all subjects"/></label><div className="all-subjects-list">{catalogueResults.map(item=><div className="all-subject-row" key={item.id}><div><b>{item.name}</b><small>{item.status==='caps-index-only'?'CAPS index only — current ATP mapping not confirmed':item.status==='specialist-atp'?'Specialist ATP offering':'ATP-listed'}</small></div><button type="button" onClick={()=>toggleEnrolledSubject(item)}>{selectedSubjectIds.includes(item.id)?'Selected':'Add'}</button></div>)}</div></div>}</section><div className="section-heading"><div><h2>Today’s prescribed work</h2><p className="muted">One specific task. Finish it properly.</p></div><span className="tag">Roadmap</span></div>
        <section className={`task-card ${rewindDone?'':'locked'}`}><div className="task-icon">{rewindDone?<Atom/>:<LockKeyhole/>}</div><div className="task-copy"><b>{subject==='Physical Science'||subject==='Physical Sciences'?'Q2 · Inclined plane':subject==='Mathematics'?'Q3 · Quadratic functions':'Learning content coming soon'}</b><p>{['Physical Science','Physical Sciences','Mathematics'].includes(subject)?'2025 DBE Trial · Paper 1 (sample task)':'CAPS subject library · roadmap not yet published'}</p><small>{rewindDone?(subject==='Physical Science'?'Draw a free-body diagram. Show N = mg cos θ.':'Complete the sketch and identify the turning point.'):'Locked until you finish tonight’s Rewind.'}</small></div><button className="round-arrow" disabled={!rewindDone} aria-label="Open past papers" onClick={()=>setTab('Past Papers')}><ChevronRight/></button></section>
        <div className="section-heading"><div><h2>Your focus</h2><p className="muted">Work on these before exam day.</p></div><button className="text-btn" onClick={()=>setShowOnboarding(true)}>Edit</button></div><div className="topic-pills dashboard-pills">{weak.map(t=><span className="pill selected" key={t}>{t}</span>)}</div>
      </>}
      {tab==='Past Papers' && <>
        <div className="page-heading"><p className="eyebrow">CAPS REVISION LIBRARY</p><h1>Past Papers &amp; Roadmaps</h1><p className="muted">Find the curriculum map, then open official DBE paper and memo archives.</p></div>
        <section className="panel roadmap-panel">
          <div className="section-heading"><div><h2>CAPS study roadmap</h2><p className="muted">Topic map linked to the reviewed DBE ATP source.</p></div><span className="tag">FET</span></div>
          <div className="roadmap-filters">
            <label>Grade<select aria-label="Roadmap grade" value={roadmapGrade} onChange={e=>setRoadmapGrade(e.target.value)}><option value="10">Grade 10</option><option value="11">Grade 11</option><option value="12">Grade 12</option></select></label>
            <label>Subject<select aria-label="Roadmap subject" value={roadmapSubjectId} onChange={e=>setRoadmapSubjectId(e.target.value as 'mathematics' | 'physical-science')}><option value="mathematics">Mathematics</option><option value="physical-science">Physical Sciences</option></select></label>
          </div>
          {activeRoadmap ? <>
            <div className="roadmap-source"><b>{activeRoadmap.sourceTitle}</b><small>DBE · {activeRoadmap.sourceProgram} · Source checked 8 November 2026</small><a href={activeRoadmap.sourceUrl} target="_blank" rel="noreferrer">Open official ATP source</a></div>
            <ul className="roadmap-topic-list">{activeRoadmap.topics.map((topic,index)=><li key={topic}><span>{index+1}</span>{topic}</li>)}</ul>
            <p className="hint">{activeRoadmap.note} Circular S19 of 2025 retained the 2023/24 ATPs with exclusions; verify the circular and any subject-specific updates before treating this as a complete current teaching schedule.</p>
          </> : <p className="content-notice">A grade and subject roadmap has not yet been verified for this selection. A CAPS catalogue listing does not by itself prove grade-specific ATP coverage.</p>}
          <p className="roadmap-source-foot"><a href="https://www.education.gov.za/Curriculum/NationalCirculars.aspx" target="_blank" rel="noreferrer">Check DBE National Circulars for updates</a></p>
        </section>
        <div className="section-heading"><div><h2>Official DBE exam archives</h2><p className="muted">Grade 12 NSC papers and memos · archive pages, not copied PDFs.</p></div></div>
        <div className="searchbox"><Search size={18}/><input placeholder="Search official archives…" value={search} onChange={e=>setSearch(e.target.value)} aria-label="Search official paper archives"/><Settings2 size={18}/></div>
        <div className="filter-row">{['All','Mathematics','Physical Science','2025','2024'].map(f=><button className={`filter ${filter===f?'active':''}`} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div>
        <h3 className="subheading">{filteredArchives.length} verified archive entries</h3>
        <div className="archive-grid">{filteredArchives.map(item=><article className="archive-card" key={item.id}>
          <div className="archive-card-top"><span className="paper-year">{item.year}</span><span className="tag">{item.sitting}</span></div>
          <b>{item.subjectName}</b><small>Grade 12 · NSC · {item.sitting} {item.year}</small>
          <div className="archive-counts"><span>{item.papers.length} question papers</span><span>{item.memos.length} memos</span></div>
          <p>{item.accessNote}</p>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">Open DBE archive page <ChevronRight size={15}/></a>
          <small className="archive-provenance">Source: {item.sourceAuthority} · index checked 8 Nov 2026</small>
        </article>)}</div>
        <p className="hint">ExamForge links to the Department of Basic Education archive. The documents remain hosted by the DBE; ExamForge does not re-host or alter the papers or marking memos.</p>
      </>}
      {tab==='Upload Notes' && <><div className="page-heading"><p className="eyebrow purple-text">YOUR NOTES. YOUR QUESTIONS.</p><h1>Upload Notes</h1><p className="muted">Add notes to generate targeted practice questions.</p></div><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={e=>pickNotes(Array.from(e.target.files||[]))}/><div className="upload-icon"><Upload size={30}/></div><b>Take a photo or upload a PDF</b><p>Capture handwritten or printed notes instantly.</p><span className="upload-link">Choose files <Plus size={15}/></span><small>JPG, PNG, WebP or PDF · Max 10 MB per file</small></label>{notes.length>0&&<div className="selected-files">{notes.map((f,i)=><div key={`${f.name}-${i}`}><FileText size={17}/><span>{f.name}</span><button aria-label={`Remove ${f.name}`} onClick={()=>setNotes(a=>a.filter(x=>x!==f))}><X size={16}/></button></div>)}<button className="primary full" onClick={uploadNotes}>Upload {notes.length} file(s) <ChevronRight size={18}/></button></div>}{noteStatus&&<p className="status-message">{noteStatus}</p>}<section className="purple-panel"><div className="purple-icon"><FlaskConical/></div><div><b>What happens next?</b><p>Coming soon: ExamForge will extract your notes, check confidence, and draft questions linked to your weak topics. You review them before they enter Rewind. For now, uploads are stored privately.</p></div></section><div className="section-heading"><div><h2>Recently uploaded</h2><p className="muted">Your study material library</p></div></div><section className="panel ai-draft-panel"><div className="section-heading"><div><h2>AI question studio</h2><p className="muted">Paste extracted study text to create one private question draft.</p></div><span className="tag">Beta · server-side</span></div><label className="field-label" htmlFor="ai-source-text">Study text</label><textarea id="ai-source-text" rows={6} maxLength={8000} value={aiSourceText} onChange={event=>setAiSourceText(event.target.value)} placeholder="Paste a section of your textbook or class notes (100–8,000 characters). Do not include personal information."/><div className="ai-source-meta"><span>{aiSourceText.length}/8,000 characters</span><span>{user?'Private learner account':'Sign in required'}</span></div><button type="button" className="primary full" disabled={aiBusy || aiSourceText.trim().length<100} onClick={()=>void generateAIQuestionDraft()}>{aiBusy?'Working securely…':'Generate one question draft'} <ChevronRight size={18}/></button>{aiGenerationStatus&&<p className="status-message" role="status">{aiGenerationStatus}</p>}{aiDraft&&<article className="ai-question-preview"><div className="ai-preview-top"><span className="tag">{aiDraft.reviewStatus==='pending'?'Pending your review':aiDraft.reviewStatus==='approved'?'Approved draft':'Rejected draft'}</span><span className="ai-confidence">Source confidence: {Math.round(aiDraft.confidence*100)}%</span></div><p className="question-source">{aiDraft.subjectName} · Grade {aiDraft.grade} · {aiDraft.topic}</p><h3>{aiDraft.prompt}</h3><ol className="ai-answer-options">{aiDraft.options.map((option,index)=><li className={index===aiDraft.answerIndex?'ai-correct-option':''} key={option}>{option}{index===aiDraft.answerIndex?' · Suggested answer':''}</li>)}</ol><div className="review-answer"><b>Explanation</b><p>{aiDraft.explanation}</p></div><p className="archive-provenance">{aiDraft.sourceLabel} · {aiDraft.provenance}</p>{aiDraft.reviewStatus==='pending'&&<div className="ai-review-actions"><button type="button" disabled={aiBusy} onClick={()=>void setAIDraftReviewStatus('rejected')}>Reject draft</button><button type="button" disabled={aiBusy} onClick={()=>void setAIDraftReviewStatus('approved')}>Approve draft</button></div>}</article>}<p className="hint">The AI draft is not inserted into Tonight’s 20. Text extraction/OCR for uploaded PDFs and images is not yet connected; paste extracted text here. The provider remains disabled until the project owner configures server-side secrets.</p></section><div className="empty-state"><BookOpen size={30}/><b>Nothing processed yet</b><p>Private uploaded files remain queued until a verified extraction service is configured.</p></div></>}
      {tab==='Progress' && <><div className="page-heading"><p className="eyebrow">EVIDENCE-BASED FEEDBACK</p><h1>Your Progress</h1><p className="muted">Accuracy reflects submitted answers. Activity is not the same as mastery.</p></div><div className="progress-summary"><div><span>Completed sessions</span><b>{doneDates.length}</b><div className="bar"><i style={{width:`${Math.min(100,doneDates.length*5)}%`}}/></div></div><div><span>Current streak</span><b>{streak}</b><div className="bar bluebar"><i style={{width:`${Math.min(100,streak*10)}%`}}/></div></div><div><span>Practice accuracy</span><b>{accuracy===null?'—':`${accuracy}%`}</b><div className="bar"><i style={{width:`${accuracy??0}%`}}/></div></div></div><section className="panel progress-panel"><h3>Recent accuracy trend</h3><div className="trend-summary"><div><small>Last 7 days</small><b>{progressInsight.recentAccuracy===null?'—':`${progressInsight.recentAccuracy}%`}</b><span>{progressInsight.recentAttempts} recorded answers</span></div><div><small>Previous 7 days</small><b>{progressInsight.previousAccuracy===null?'—':`${progressInsight.previousAccuracy}%`}</b><span>{progressInsight.previousAttempts} recorded answers</span></div><span className={`trend-label trend-${progressInsight.trend}`}>{progressInsight.trend==='insufficient-data'?'Not enough trend data':progressInsight.trend}</span></div></section><section className="panel recommendation-panel"><div className="section-heading"><div><h3>Suggested next focus</h3><p className="muted">Optional · based on your recorded answers</p></div><span className="tag">You choose</span></div>{progressInsight.recommendedTopic ? <><b>{progressInsight.recommendedTopic.topic}</b><p className="muted">{progressInsight.explanation}</p><button type="button" className="text-btn" onClick={()=>{setWeak([progressInsight.recommendedTopic!.topic]);setToast(`Suggested focus set to ${progressInsight.recommendedTopic!.topic}. You can change it whenever you like.`);setTab('Dashboard')}}>Use this topic next</button></> : <p className="muted">{progressInsight.explanation}</p>}</section><section className="panel progress-panel"><h3>Topic accuracy · last 20 attempts</h3>{progressInsight.topics.map(item=><div className="mastery-row" key={item.topic}><span>{item.topic}<small className="evidence-count">{item.attempts} attempt{item.attempts===1?'':'s'}{item.evidenceStatus==='insufficient-sample'?' · building sample':''}</small></span><b>{item.attempts===0?'—':`${item.accuracy}%`}</b><div className="bar"><i style={{width:`${item.attempts?item.accuracy:0}%`}}/></div></div>)}</section><section className="panel"><h3>Study activity</h3>{doneDates.length===0?<div className="activity-empty"><Activity size={25}/><p>Complete your first Rewind to start building your activity history.</p></div>:<div className="activity-empty"><Activity size={25}/><p>{doneDates.length} Rewind{doneDates.length===1?'':'s'} completed. Last: {[...doneDates].sort().slice(-1)[0]}.</p></div>}</section><section className="panel mistake-notebook"><div className="section-heading"><div><h3>Mistake notebook</h3><p className="muted">{mistakeQuestions.length} saved question{mistakeQuestions.length===1?'':'s'} · {dueMistakeCount} due to review</p></div></div><label className="catalogue-search"><Search size={16}/><input aria-label="Search mistake notebook" placeholder="Search saved mistakes…" value={mistakeSearch} onChange={event=>setMistakeSearch(event.target.value)}/></label>{mistakeQuestions.length===0?<div className="activity-empty"><BookOpen size={24}/><p>No saved mistakes match this search. Incorrect answers from practice sessions appear here with corrections.</p></div>:mistakeQuestions.map(question=>{const review=flashcardReviews[question.id];const due=isFlashcardDue(review);const latest=attempts.filter(item=>item.questionId===question.id&&!item.correct).slice(-1)[0];return <article className="mistake-row" key={question.id}><div className="mistake-title-row"><b>{question.topic}</b><span className={`review-status ${due?'due':'scheduled'}`}>{due?'Due now':`Due ${new Date(review!.next_review_at).toLocaleDateString()}`}</span></div><p>{question.prompt}</p><small>Your answer: {question.options[latest?.response?.selected ?? -1] ?? 'Not recorded'}</small><p>Correct answer: {question.options[question.answer]}</p><p>{question.explanation}</p><button type="button" className="text-btn" onClick={()=>{setActiveReviewId(question.id);setFlashcardRevealed(false)}}>{due?'Review now':'Review card'}</button></article>})}</section><p className="hint">Accuracy is calculated from saved attempts per topic; a small sample is shown as developing evidence, not mastery.</p></>}
    </main>
    <Navigation className="bottom-nav" label="Main navigation" items={[
      {href:'#dashboard',label:<><Home size={21}/><span>Dashboard</span></>,current:tab==='Dashboard',onClick:e=>{e.preventDefault();setTab('Dashboard')}},
      {href:'#papers',label:<><FileText size={21}/><span>Past Papers</span></>,current:tab==='Past Papers',onClick:e=>{e.preventDefault();setTab('Past Papers')}},
      {href:'#upload',label:<><Plus size={21}/><span>Upload</span></>,current:tab==='Upload Notes',onClick:e=>{e.preventDefault();setTab('Upload Notes')}},
      {href:'#progress',label:<><Activity size={21}/><span>Progress</span></>,current:tab==='Progress',onClick:e=>{e.preventDefault();setTab('Progress')}}
    ]} />
    {rewindOpen && currentQuestion && <div className="rewind-overlay"><header className="rewind-head"><button type="button" className="text-btn" onClick={saveAndExitSession}>Save &amp; exit</button><b>ExamForge <span>/ Tonight’s 20 {questionIndex+1}/{sessionQs.length}</span></b><strong><Clock3 size={17}/> {fmt(Math.max(0,REWIND_SECONDS-seconds))}</strong></header><div className="rewind-body"><div className="rewind-label"><Flame size={18} fill="currentColor"/> TONIGHT’S 20 · FOCUSED PRACTICE</div><div className="question-card"><span className="question-source">{subject} · Grade {currentQuestion.grade} · {currentQuestion.topic}</span><p className="question-provenance">{currentQuestion.sourceLabel} · {currentQuestion.provenance}</p><h2>{currentQuestion.prompt}</h2><div className="answer-list">{currentQuestion.options.map((o,i)=><button key={o} className={`answer-option ${selected===i?'picked':''} ${selected!==null&&i===currentQuestion.answer?'correct':''} ${selected===i&&i!==currentQuestion.answer?'incorrect':''}`} onClick={()=>chooseAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{o}{selected!==null&&i===currentQuestion.answer&&<Check className="answer-check"/>}</button>)}</div>{selected!==null&&<div className="explanation"><b>{selected===currentQuestion.answer?'Correct.':'Not quite. Learn the method.'}</b><p>{currentQuestion.explanation}</p></div>}</div><button className="primary full submit-answer" disabled={selected===null} onClick={nextQuestion}>{questionIndex>=sessionQs.length-1?'Finish Rewind':'Next question'} <ChevronRight/></button><p className="privacy"><ShieldCheck size={15}/> Active time only — the timer pauses if you leave the app</p><button type="button" className="text-btn" onClick={abandonSession}>Abandon this session</button></div></div>}
    {activeReviewId && (() => { const question = PRACTICE_QUESTIONS.find(item => item.id === activeReviewId); return question ? <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="review-card-title"><section className="review-card"><div className="review-card-head"><span className="tag">Spaced review</span><button type="button" className="text-btn" onClick={()=>{setActiveReviewId(null);setFlashcardRevealed(false)}}>Close</button></div><p className="eyebrow">{question.subject} · {question.topic}</p><h2 id="review-card-title">{question.prompt}</h2>{flashcardRevealed ? <div className="review-answer"><b>Correct answer</b><p>{question.options[question.answer]}</p><b>Explanation</b><p>{question.explanation}</p></div> : <button type="button" className="primary full" onClick={()=>setFlashcardRevealed(true)}>Reveal correction</button>}{flashcardRevealed && <><p className="hint">How well did you recall it?</p><div className="review-grade-actions"><button type="button" onClick={()=>void submitFlashcardGrade(question.id,0)}>Again</button><button type="button" onClick={()=>void submitFlashcardGrade(question.id,1)}>Hard</button><button type="button" onClick={()=>void submitFlashcardGrade(question.id,2)}>Good</button><button type="button" onClick={()=>void submitFlashcardGrade(question.id,3)}>Easy</button></div></>}</section></div> : null })()}
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
