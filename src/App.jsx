import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  authAliases,
  hasSupabaseConfig,
  privateBucketName,
  supabase,
} from './supabaseClient'

const fallbackDocs = [
  {
    id: 'public:welcome.md',
    title: 'Welcome Guide',
    description: 'คู่มือทดลองระบบอ่านต่อและมาร์กจุดสำคัญ',
    folderPath: '',
    folderLabel: 'เริ่มต้นใช้งาน',
    relativePath: 'welcome.md',
    sourceType: 'public',
    path: 'docs/welcome.md',
    accessRole: 'shared',
    storagePath: null,
  },
]

const passageSelector = 'h1, h2, h3, h4, p, li, blockquote, pre'
const emptyPassage = {
  index: 0,
  heading: 'พร้อมอ่าน',
  excerpt: 'เลื่อนลงไปเรื่อย ๆ แล้วระบบจะตามตำแหน่งที่คุณอ่านอยู่ให้',
}

const progressKey = (docId) => `readmd-progress:${docId}`
const bookmarkKey = (docId) => `readmd-bookmark:${docId}`
const publicUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const configuredBranch = 'main'

function inferGitHubRepo() {
  if (typeof window === 'undefined') {
    return null
  }

  const { hostname, pathname } = window.location

  if (!hostname.endsWith('github.io')) {
    return null
  }

  const owner = hostname.replace('.github.io', '')
  const [repo] = pathname.split('/').filter(Boolean)

  if (!owner || !repo) {
    return null
  }

  return { owner, repo, branch: configuredBranch }
}

function fileNameToTitle(name) {
  return name
    .replace(/\.md$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function folderPathToLabel(folderPath) {
  if (!folderPath) {
    return 'เริ่มต้นใช้งาน'
  }

  return folderPath
    .split('/')
    .map((segment) => fileNameToTitle(segment))
    .join(' / ')
}

function buildDocRecord({
  id,
  title,
  description,
  relativePath,
  sourcePath,
  rawUrl,
  sourceType = 'public',
  accessRole = 'shared',
  storagePath = null,
}) {
  const normalizedPath = relativePath.replace(/^docs\//, '')
  const segments = normalizedPath.split('/')
  const fileName = segments.at(-1) ?? normalizedPath
  const folderPath = segments.slice(0, -1).join('/')

  return {
    id,
    title,
    description,
    sourceType,
    folderPath,
    folderLabel: folderPathToLabel(folderPath),
    relativePath: normalizedPath,
    fileName,
    path: rawUrl ?? sourcePath,
    accessRole,
    storagePath,
  }
}

function resolveAllowedRoles(role) {
  if (role === 'admin') {
    return ['shared', 'user', 'admin']
  }

  return ['shared', 'user']
}

function inferProfileFromEmail(email) {
  if (!email) {
    return null
  }

  if (email === authAliases.thirasak) {
    return {
      username: 'Thirasak',
      display_name: 'Thirasak',
      role: 'admin',
    }
  }

  if (email === authAliases.user) {
    return {
      username: 'User',
      display_name: 'User',
      role: 'user',
    }
  }

  return {
    username: email.split('@')[0] ?? 'reader',
    display_name: email,
    role: 'user',
  }
}

function trimText(text, maxLength = 140) {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength).trimEnd()}...`
}

function readStoredProgress(docId) {
  if (typeof window === 'undefined') {
    return 0
  }

  return Number(localStorage.getItem(progressKey(docId)) ?? 0)
}

function readStoredBookmark(docId) {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = localStorage.getItem(bookmarkKey(docId))

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getPassageNodes(article) {
  if (!article) {
    return []
  }

  return [...article.querySelectorAll(passageSelector)].filter((node) =>
    trimText(node.textContent, 20),
  )
}

function getPassageSnapshot(article, index) {
  const nodes = getPassageNodes(article)
  const target = nodes[index] ?? nodes[0]

  if (!target) {
    return emptyPassage
  }

  let heading = ''

  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const node = nodes[cursor]

    if (/^H[1-4]$/.test(node.tagName)) {
      heading = trimText(node.textContent, 80)
      break
    }
  }

  return {
    index,
    heading: heading || 'กำลังอ่านต่อ',
    excerpt: trimText(target.textContent, 160),
  }
}

function detectCurrentPassage(article) {
  const nodes = getPassageNodes(article)

  if (nodes.length === 0) {
    return emptyPassage
  }

  const pivot = window.innerHeight * 0.28
  let activeIndex = 0

  nodes.forEach((node, index) => {
    if (node.getBoundingClientRect().top <= pivot) {
      activeIndex = index
    }
  })

  return getPassageSnapshot(article, activeIndex)
}

function groupDocs(docs) {
  const groups = new Map()

  docs.forEach((doc) => {
    const key = doc.folderPath || '__root__'

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        folderPath: doc.folderPath,
        label: doc.folderLabel,
        docs: [],
      })
    }

    groups.get(key).docs.push(doc)
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      docs: group.docs.sort((left, right) => left.title.localeCompare(right.title)),
    }))
    .sort((left, right) => {
      if (left.folderPath === '' && right.folderPath !== '') {
        return -1
      }

      if (left.folderPath !== '' && right.folderPath === '') {
        return 1
      }

      return left.label.localeCompare(right.label)
    })
}

function App() {
  const [publicDocs, setPublicDocs] = useState(fallbackDocs)
  const [privateDocs, setPrivateDocs] = useState([])
  const [view, setView] = useState('library')
  const [activeDocId, setActiveDocId] = useState(null)
  const [content, setContent] = useState('')
  const [savedProgress, setSavedProgress] = useState(0)
  const [bookmark, setBookmark] = useState(null)
  const [status, setStatus] = useState('เลือกไฟล์ที่อยากอ่านได้เลย')
  const [currentPassage, setCurrentPassage] = useState(emptyPassage)
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isLoadingPrivateDocs, setIsLoadingPrivateDocs] = useState(false)
  const [libraryRefreshToken, setLibraryRefreshToken] = useState(0)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const articleRef = useRef(null)
  const saveTimerRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const pendingRestoreRef = useRef(null)
  const currentPassageRef = useRef(emptyPassage)
  const savedProgressRef = useRef(0)
  const lastScrollSampleRef = useRef(0)

  const publicLibraryDocs = useMemo(
    () =>
      publicDocs.map((doc, index) => ({
        ...doc,
        progress: readStoredProgress(doc.id),
        bookmark: readStoredBookmark(doc.id),
        shelfTone: index % 4,
      })),
    [publicDocs, libraryRefreshToken],
  )

  const privateLibraryDocs = useMemo(
    () =>
      privateDocs.map((doc, index) => ({
        ...doc,
        progress: readStoredProgress(doc.id),
        bookmark: readStoredBookmark(doc.id),
        shelfTone: index % 4,
      })),
    [privateDocs, libraryRefreshToken],
  )

  const libraryDocs = useMemo(
    () => [...publicLibraryDocs, ...privateLibraryDocs],
    [publicLibraryDocs, privateLibraryDocs],
  )

  const activeDoc = useMemo(
    () => libraryDocs.find((doc) => doc.id === activeDocId) ?? null,
    [libraryDocs, activeDocId],
  )

  const publicGroups = useMemo(() => groupDocs(publicLibraryDocs), [publicLibraryDocs])
  const privateGroups = useMemo(() => groupDocs(privateLibraryDocs), [privateLibraryDocs])
  const signedInLabel =
    profile?.display_name ?? profile?.username ?? session?.user?.email ?? 'Reader'

  useEffect(() => {
    currentPassageRef.current = currentPassage
  }, [currentPassage])

  useEffect(() => {
    savedProgressRef.current = savedProgress
  }, [savedProgress])

  useEffect(() => {
    let cancelled = false

    async function loadLibrary() {
      setIsLoadingLibrary(true)
      const repoInfo = inferGitHubRepo()

      if (!repoInfo) {
        if (!cancelled) {
          setPublicDocs(fallbackDocs)
          setStatus('พร้อมอ่านจากเอกสารในเครื่องและไฟล์ตัวอย่าง')
          setIsLoadingLibrary(false)
        }
        return
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${repoInfo.branch}?recursive=1`,
        )

        if (!response.ok) {
          throw new Error(`โหลดรายการเอกสารไม่สำเร็จ: ${response.status}`)
        }

        const payload = await response.json()
        const markdownDocs = (payload.tree ?? [])
          .filter(
            (item) =>
              item.type === 'blob' &&
              item.path.startsWith('public/docs/') &&
              /\.md$/i.test(item.path),
          )
          .map((item) => {
            const relativePath = item.path.replace(/^public\/docs\//, '')

            return buildDocRecord({
              id: `public:${relativePath.toLowerCase()}`,
              title: fileNameToTitle(relativePath.split('/').at(-1) ?? relativePath),
              description: 'เปิดอ่านจากคลัง Markdown บน GitHub ของคุณ',
              relativePath,
              sourcePath: `docs/${relativePath}`,
              rawUrl: `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${item.path}`,
              sourceType: 'public',
            })
          })
          .sort((left, right) => left.title.localeCompare(right.title))

        if (!cancelled) {
          setPublicDocs(markdownDocs.length > 0 ? markdownDocs : fallbackDocs)
          setStatus('เลือกเอกสารจากชั้นหนังสือแล้วเริ่มอ่านต่อได้ทันที')
        }
      } catch (error) {
        if (!cancelled) {
          setPublicDocs(fallbackDocs)
          setStatus(`ใช้รายการสำรองแทน: ${String(error.message ?? error)}`)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLibrary(false)
        }
      }
    }

    loadLibrary()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthReady(true)
      setSession(null)
      setProfile(null)
      setPrivateDocs([])
      return
    }

    let active = true
    setAuthReady(false)

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return
      }

      setSession(data.session ?? null)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return
      }

      setSession(nextSession ?? null)
      setAuthReady(true)

      if (!nextSession) {
        setProfile(null)
        setPrivateDocs([])
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authReady) {
      return
    }

    if (!session?.user) {
      setProfile(null)
      return
    }

    let cancelled = false

    async function loadProfile() {
      const fallbackProfile = inferProfileFromEmail(session.user.email)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (!cancelled) {
          setProfile(data ?? fallbackProfile)
        }
      } catch {
        if (!cancelled) {
          setProfile(fallbackProfile)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [authReady, session])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authReady) {
      return
    }

    if (!session?.user || !profile?.role) {
      setPrivateDocs([])
      setIsLoadingPrivateDocs(false)
      return
    }

    let cancelled = false

    async function loadPrivateDocs() {
      setIsLoadingPrivateDocs(true)

      try {
        const allowedRoles = resolveAllowedRoles(profile.role)
        const { data, error } = await supabase
          .from('private_documents')
          .select('title, description, folder_path, storage_path, access_role')
          .in('access_role', allowedRoles)
          .order('folder_path', { ascending: true })
          .order('title', { ascending: true })

        if (error) {
          throw error
        }

        const docs = (data ?? []).map((row) => {
          const storagePath = row.storage_path.replace(/^\/+/, '')
          const fileName = storagePath.split('/').at(-1) ?? storagePath
          const folderPath = row.folder_path?.replace(/^\/+|\/+$/g, '') ?? ''
          const relativePath = folderPath ? `${folderPath}/${fileName}` : fileName

          return buildDocRecord({
            id: `private:${storagePath.toLowerCase()}`,
            title: row.title || fileNameToTitle(fileName),
            description:
              row.description || 'เปิดอ่านจากคลังส่วนตัวที่ซ่อนด้วยสิทธิ์ผู้ใช้',
            relativePath,
            sourcePath: storagePath,
            sourceType: 'private',
            accessRole: row.access_role ?? 'user',
            storagePath,
          })
        })

        if (!cancelled) {
          setPrivateDocs(docs)
        }
      } catch (error) {
        if (!cancelled) {
          setPrivateDocs([])
          setAuthMessage(`โหลดคลังส่วนตัวไม่สำเร็จ: ${String(error.message ?? error)}`)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPrivateDocs(false)
        }
      }
    }

    loadPrivateDocs()

    return () => {
      cancelled = true
    }
  }, [authReady, session, profile])

  useEffect(() => {
    if (view !== 'reader' || !activeDocId || activeDoc) {
      return
    }

    setView('library')
    setContent('')
    setBookmark(null)
    setSavedProgress(0)
    setCurrentPassage(emptyPassage)
    setStatus('เอกสารนี้ถูกซ่อนหรือคุณไม่มีสิทธิ์เข้าถึงแล้ว')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view, activeDoc, activeDocId])

  useEffect(() => {
    if (view !== 'reader' || !activeDoc) {
      return
    }

    let cancelled = false

    async function loadMarkdown() {
      try {
        setIsLoadingContent(true)
        setStatus('กำลังเปิดไฟล์...')
        setCurrentPassage(emptyPassage)
        setContent('')
        window.scrollTo({ top: 0, behavior: 'auto' })

        let markdown = ''

        if (activeDoc.sourceType === 'private') {
          if (!supabase || !activeDoc.storagePath) {
            throw new Error('ยังไม่ได้ตั้งค่า Supabase สำหรับไฟล์ส่วนตัว')
          }

          const { data, error } = await supabase.storage
            .from(privateBucketName)
            .download(activeDoc.storagePath)

          if (error) {
            throw error
          }

          markdown = await data.text()
        } else {
          const source = activeDoc.path.startsWith('http')
            ? activeDoc.path
            : publicUrl(activeDoc.path)
          const response = await fetch(source)

          if (!response.ok) {
            throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${response.status}`)
          }

          markdown = await response.text()
        }

        if (cancelled) {
          return
        }

        const storedProgress = readStoredProgress(activeDoc.id)
        const storedBookmark = readStoredBookmark(activeDoc.id)

        pendingRestoreRef.current = storedProgress
        setContent(markdown)
        setSavedProgress(storedProgress)
        setBookmark(storedBookmark)
        setStatus('พร้อมอ่าน')
      } catch (error) {
        if (cancelled) {
          return
        }

        setContent(`# โหลดไฟล์ไม่ได้\n\n${String(error.message ?? error)}`)
        setSavedProgress(0)
        setBookmark(null)
        setStatus('เกิดปัญหาในการโหลดไฟล์')
      } finally {
        if (!cancelled) {
          setIsLoadingContent(false)
        }
      }
    }

    loadMarkdown()

    return () => {
      cancelled = true
    }
  }, [view, activeDoc])

  useEffect(() => {
    if (view !== 'reader' || !content) {
      return
    }

    const frame = requestAnimationFrame(() => {
      const pendingProgress = pendingRestoreRef.current

      if (typeof pendingProgress === 'number') {
        restoreProgress(pendingProgress, false)
        pendingRestoreRef.current = null
      }

      setCurrentPassage(detectCurrentPassage(articleRef.current))
    })

    return () => cancelAnimationFrame(frame)
  }, [view, content])

  useEffect(() => {
    if (view !== 'reader' || !activeDoc || !content) {
      return undefined
    }

    const updateReaderState = (force = false) => {
      scrollFrameRef.current = null
      const now = window.performance.now()

      if (!force && now - lastScrollSampleRef.current < 80) {
        return
      }

      lastScrollSampleRef.current = now

      const progress = getReadingProgress()
      const nextPassage = detectCurrentPassage(articleRef.current)

      if (progress !== savedProgressRef.current) {
        savedProgressRef.current = progress
        setSavedProgress(progress)
      }

      setCurrentPassage((previous) =>
        previous.index === nextPassage.index &&
        previous.excerpt === nextPassage.excerpt &&
        previous.heading === nextPassage.heading
          ? previous
          : nextPassage,
      )

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        localStorage.setItem(progressKey(activeDoc.id), String(progress))
      }, 120)
    }

    const handleScroll = () => {
      if (scrollFrameRef.current) {
        return
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => updateReaderState(false))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    updateReaderState(true)

    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [view, activeDoc, content])

  function getReadingProgress() {
    const article = articleRef.current

    if (!article) {
      return 0
    }

    const articleTop = article.offsetTop
    const articleHeight = article.offsetHeight
    const viewportHeight = window.innerHeight
    const scrollable = Math.max(articleHeight - viewportHeight, 1)
    const current = Math.min(Math.max(window.scrollY - articleTop, 0), scrollable)

    return Math.round((current / scrollable) * 100)
  }

  function restoreProgress(progress, smooth) {
    const article = articleRef.current

    if (!article) {
      return
    }

    const articleTop = article.offsetTop
    const articleHeight = article.offsetHeight
    const viewportHeight = window.innerHeight
    const scrollable = Math.max(articleHeight - viewportHeight, 1)
    const target = Math.max(articleTop + (scrollable * progress) / 100 - 108, 0)

    window.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' })
  }

  function persistProgress() {
    if (!activeDoc) {
      return
    }

    localStorage.setItem(progressKey(activeDoc.id), String(savedProgress))
  }

  function refreshLibraryStats() {
    setLibraryRefreshToken((value) => value + 1)
  }

  function openDoc(docId) {
    setActiveDocId(docId)
    setView('reader')
  }

  function backToLibrary() {
    persistProgress()
    refreshLibraryStats()
    setView('library')
    setStatus('กลับมาที่ชั้นหนังสือแล้ว')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function handleSaveBookmark() {
    if (!activeDoc) {
      return
    }

    const payload = {
      progress: getReadingProgress(),
      passageIndex: currentPassageRef.current.index,
      heading: currentPassageRef.current.heading,
      excerpt: currentPassageRef.current.excerpt,
      savedAt: new Date().toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }

    localStorage.setItem(bookmarkKey(activeDoc.id), JSON.stringify(payload))
    setBookmark(payload)
    setStatus('มาร์กจุดอ่านปัจจุบันพร้อมจับข้อความบริเวณนั้นแล้ว')
    refreshLibraryStats()
  }

  function handleJumpToBookmark() {
    if (!bookmark) {
      return
    }

    const passageNodes = getPassageNodes(articleRef.current)
    const targetNode =
      typeof bookmark.passageIndex === 'number' ? passageNodes[bookmark.passageIndex] : null

    if (targetNode) {
      const top = Math.max(targetNode.getBoundingClientRect().top + window.scrollY - 132, 0)
      window.scrollTo({ top, behavior: 'smooth' })
    } else {
      restoreProgress(bookmark.progress ?? 0, true)
    }

    setStatus('กลับไปที่จุดมาร์กเดิมแล้ว')
  }

  async function handleSignIn(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      setAuthMessage('ต้องตั้งค่า Supabase ก่อนจึงจะเปิดคลังส่วนตัวได้')
      return
    }

    const normalizedUsername = loginForm.username.trim().toLowerCase()
    const email = authAliases[normalizedUsername] ?? loginForm.username.trim()
    const password = loginForm.password.trim()

    if (!email || !password) {
      setAuthMessage('กรอกชื่อผู้ใช้และรหัสผ่านก่อน')
      return
    }

    setIsAuthBusy(true)
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthMessage(`เข้าสู่ระบบไม่สำเร็จ: ${error.message}`)
    } else {
      setLoginForm({ username: '', password: '' })
      setAuthMessage('เข้าสู่ระบบแล้ว เปิดคลังส่วนตัวได้เลย')
    }

    setIsAuthBusy(false)
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    setIsAuthBusy(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthMessage(`ออกจากระบบไม่สำเร็จ: ${error.message}`)
    } else {
      setAuthMessage('ออกจากระบบแล้ว')
      setLoginForm({ username: '', password: '' })
    }

    setIsAuthBusy(false)
  }

  function renderShelfSection(groups, shelfName) {
    return groups.map((group) => (
      <section key={`${shelfName}:${group.key}`} className="shelf-group">
        <div className="shelf-heading">
          <p className="eyebrow">{shelfName}</p>
          <h2>{group.label}</h2>
          <small>{group.docs.length} ไฟล์ในหมวดนี้</small>
        </div>

        <div className="shelf-books">
          {group.docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={`book-card tone-${doc.shelfTone}`}
              onClick={() => openDoc(doc.id)}
            >
              <span className={`book-spine ${doc.sourceType === 'private' ? 'locked' : ''}`}>
                {doc.sourceType === 'private' ? 'LOCK' : '.md'}
              </span>
              <div className="book-content">
                <p className="book-kicker">{doc.folderLabel}</p>
                <h2>{doc.title}</h2>
                <p>{doc.description}</p>
                <div className="book-progress">
                  <span>อ่านไปแล้ว {doc.progress}%</span>
                  <div className="progress-track" aria-hidden="true">
                    <span style={{ width: `${doc.progress}%` }} />
                  </div>
                </div>
                <div className="book-footer">
                  <small>
                    {doc.bookmark?.savedAt
                      ? `Bookmark ล่าสุด ${doc.bookmark.savedAt}`
                      : doc.relativePath}
                  </small>
                  <strong>{doc.sourceType === 'private' ? 'เปิดแบบส่วนตัว' : 'เปิดอ่าน'}</strong>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    ))
  }

  return (
    <div className={view === 'library' ? 'app-shell library-shell' : 'app-shell reader-shell'}>
      {view === 'library' ? (
        <main className="library-view">
          <section className="library-hero">
            <div className="library-copy">
              <p className="eyebrow">ReadMD Library</p>
              <h1>ชั้นหนังสือ Markdown ที่แยก public และ private ได้จริง</h1>
              <p className="library-lede">
                ชั้น public จะโหลดจาก `public/docs` ตามเดิม ส่วนชั้น private จะดึงจาก
                Supabase หลังล็อกอินแล้วเท่านั้น ทำให้ไฟล์ลับไม่ต้องอยู่ใน GitHub และไม่
                หลุดไปกับโปรเจกต์ public ของคุณ
              </p>
              <div className="library-meta">
                <span>{libraryDocs.length} ไฟล์ที่คุณเห็นได้ตอนนี้</span>
                <span>{status}</span>
              </div>
            </div>

            <div className="library-visual" aria-hidden="true">
              <div className="visual-stack">
                <span />
                <span />
                <span />
              </div>
              <div className="visual-note">
                <strong>Public + Private</strong>
                <p>ของสาธารณะอยู่ใน GitHub ได้ ส่วนของที่ซ่อนต้องแยกไป private bucket</p>
              </div>
            </div>
          </section>

          <section className="auth-panel" aria-label="การเข้าสู่ระบบ">
            <article className="auth-card">
              <p className="eyebrow">Private Shelf Access</p>
              <h2 className="section-heading">ล็อกอินเพื่อเปิดชั้นหนังสือส่วนตัว</h2>

              {!hasSupabaseConfig ? (
                <>
                  <p className="auth-copy">
                    ตอนนี้โปรเจกต์ยังไม่มีไฟล์ `.env` สำหรับ Supabase จึงเปิดได้เฉพาะ public
                    shelf เท่านั้น
                  </p>
                  <p className="auth-hint">
                    หลังจากตั้งค่าเสร็จ ระบบนี้จะไม่เก็บไฟล์ private ไว้ใน `public/docs`
                    และคนที่ clone repo ก็จะไม่เห็นไฟล์เหล่านั้น
                  </p>
                </>
              ) : session && profile ? (
                <>
                  <p className="auth-copy">
                    ตอนนี้คุณล็อกอินเป็น <strong>{signedInLabel}</strong> และกำลังใช้สิทธิ์{' '}
                    <strong>{profile.role === 'admin' ? 'ADMIN' : 'USER'}</strong>
                  </p>
                  <p className="auth-hint">
                    Private shelf จะโชว์เฉพาะไฟล์ที่ role นี้มีสิทธิ์อ่านเท่านั้น
                  </p>
                  <button
                    type="button"
                    className="auth-button secondary"
                    onClick={handleSignOut}
                    disabled={isAuthBusy}
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <form className="auth-form" onSubmit={handleSignIn}>
                  <label>
                    <span>ชื่อผู้ใช้</span>
                    <input
                      type="text"
                      value={loginForm.username}
                      onChange={(event) =>
                        setLoginForm((previous) => ({
                          ...previous,
                          username: event.target.value,
                        }))
                      }
                      placeholder="Thirasak หรือ User"
                      autoComplete="username"
                    />
                  </label>
                  <label>
                    <span>รหัสผ่าน</span>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((previous) => ({
                          ...previous,
                          password: event.target.value,
                        }))
                      }
                      placeholder="กรอกรหัสผ่านจาก Supabase Auth"
                      autoComplete="current-password"
                    />
                  </label>
                  <button type="submit" className="auth-button" disabled={isAuthBusy || !authReady}>
                    {isAuthBusy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </button>
                </form>
              )}

              {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            </article>
            <article className="auth-card auth-card-secondary">
              <p className="eyebrow">Security Note</p>
              <h2 className="section-heading">หลักการที่ทำให้ซ่อนจริง</h2>
              <ul className="rule-list">
                <li>ไฟล์ใน `public/docs` ยังเป็น public เหมือนเดิม</li>
                <li>ไฟล์ private ต้องอยู่ใน Supabase Storage แบบ private bucket เท่านั้น</li>
                <li>repo GitHub จะเก็บแค่โค้ดหน้าเว็บ ไม่เก็บเอกสาร private</li>
                <li>คนที่ไม่ได้ล็อกอินหรือไม่มี role ตรง จะไม่เห็นรายชื่อไฟล์ private</li>
              </ul>
            </article>
          </section>

          <section className="library-grid" aria-label="ชั้นหนังสือ Markdown">
            <section className="shelf-group">
              <div className="shelf-heading">
                <p className="eyebrow">Public Shelf</p>
                <h2>คลังสาธารณะ</h2>
                <small>{publicLibraryDocs.length} ไฟล์</small>
              </div>

              {isLoadingLibrary ? (
                <article className="book-card loading-card">
                  <p>กำลังโหลดรายการหนังสือจากคลัง GitHub...</p>
                </article>
              ) : (
                renderShelfSection(publicGroups, 'Public Shelf')
              )}
            </section>

            <section className="shelf-group">
              <div className="shelf-heading">
                <p className="eyebrow">Private Shelf</p>
                <h2>คลังส่วนตัว</h2>
                <small>
                  {session && profile
                    ? `${privateLibraryDocs.length} ไฟล์ที่ role นี้อ่านได้`
                    : 'ต้องล็อกอินก่อน'}
                </small>
              </div>

              {!hasSupabaseConfig ? (
                <article className="book-card loading-card">
                  <p>ตั้งค่า Supabase ก่อน แล้วชั้น private จะเริ่มทำงาน</p>
                </article>
              ) : !authReady ? (
                <article className="book-card loading-card">
                  <p>กำลังตรวจสถานะการเข้าสู่ระบบ...</p>
                </article>
              ) : !session ? (
                <article className="book-card loading-card">
                  <p>ล็อกอินก่อน แล้วระบบจะดึงเฉพาะเอกสาร private ที่คุณมีสิทธิ์เห็น</p>
                </article>
              ) : isLoadingPrivateDocs ? (
                <article className="book-card loading-card">
                  <p>กำลังโหลดคลังส่วนตัวจาก Supabase...</p>
                </article>
              ) : privateGroups.length === 0 ? (
                <article className="book-card loading-card">
                  <p>role นี้ยังไม่มีเอกสาร private หรือยังไม่ได้เพิ่มข้อมูลในตาราง private_documents</p>
                </article>
              ) : (
                renderShelfSection(privateGroups, 'Private Shelf')
              )}
            </section>
          </section>
        </main>
      ) : (
        <main className="reader-view">
          <header className="reader-topbar">
            <button type="button" className="back-button" onClick={backToLibrary}>
              กลับไปชั้นหนังสือ
            </button>
            <div className="reader-title">
              <p className="eyebrow">
                {activeDoc?.sourceType === 'private' ? 'Private Reading' : 'Now Reading'}
              </p>
              <h1>{activeDoc?.title ?? 'กำลังเปิดไฟล์'}</h1>
              <p className="reader-subtitle">{activeDoc?.folderLabel ?? 'กำลังเตรียมเอกสาร'}</p>
            </div>
            <div className="reader-chip">
              <span>{savedProgress}%</span>
              <small>
                {activeDoc?.sourceType === 'private' ? 'อ่านจากคลังส่วนตัว' : 'อ่านถึงตรงนี้แล้ว'}
              </small>
            </div>
          </header>

          <aside className="floating-hud">
            <div className="hud-card">
              <p className="hud-label">ตำแหน่งปัจจุบัน</p>
              <h2>{currentPassage.heading}</h2>
              <p className="hud-excerpt">{currentPassage.excerpt}</p>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${savedProgress}%` }} />
              </div>
              <p className="hud-meta">อ่านไปแล้ว {savedProgress}%</p>
            </div>

            <div className="hud-card bookmark-card">
              <p className="hud-label">จุดมาร์ก</p>
              <p className="hud-excerpt">
                {bookmark?.excerpt ??
                  'ยังไม่มีจุดมาร์กสำหรับไฟล์นี้ กดปุ่มด้านล่างเมื่อถึงช่วงที่อยากกลับมาอ่าน'}
              </p>
              <p className="hud-meta">
                {bookmark?.savedAt ? `${bookmark.savedAt} · ${bookmark.progress}%` : 'ยังไม่ได้บันทึก'}
              </p>
            </div>
          </aside>

          <section className="reader-body">
            <article ref={articleRef} className="markdown-body">
              <ReactMarkdown>
                {content || (isLoadingContent ? '# กำลังโหลด...\n\nรอสักครู่' : '# ยังไม่มีเอกสาร')}
              </ReactMarkdown>
            </article>
          </section>

          <div className="reader-dock">
            <div className="reader-dock-copy">
              <p className="hud-label">จุดมาร์กลอย</p>
              <strong>{bookmark?.heading ?? currentPassage.heading}</strong>
              <small>
                {bookmark?.excerpt
                  ? trimText(bookmark.excerpt, 88)
                  : 'กดมาร์กตอนถึงย่อหน้าที่อยากกลับมาอ่าน แล้วปุ่มนี้จะตามคุณไปตลอด'}
              </small>
            </div>

            <div className="floating-actions">
              <button type="button" onClick={handleSaveBookmark}>
                มาร์กตรงนี้
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={handleJumpToBookmark}
                disabled={!bookmark}
              >
                กลับไปจุดมาร์ก
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}

export default App
