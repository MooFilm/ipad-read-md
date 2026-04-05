import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const fallbackDocs = [
  {
    id: 'welcome',
    title: 'Welcome Guide',
    description: 'ตัวอย่างบทความสำหรับลองระบบจดจำตำแหน่งอ่าน',
    path: 'docs/welcome.md',
  },
]

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

function App() {
  const [docs, setDocs] = useState(fallbackDocs)
  const [activeDocId, setActiveDocId] = useState(fallbackDocs[0].id)
  const [content, setContent] = useState('')
  const [savedProgress, setSavedProgress] = useState(0)
  const [bookmark, setBookmark] = useState(null)
  const [status, setStatus] = useState('พร้อมอ่าน')
  const articleRef = useRef(null)
  const saveTimerRef = useRef(null)

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeDocId) ?? docs[0] ?? null,
    [activeDocId],
  )

  useEffect(() => {
    let cancelled = false

    async function loadLibrary() {
      const repoInfo = inferGitHubRepo()

      if (!repoInfo) {
        setDocs(fallbackDocs)
        setActiveDocId((current) => current || fallbackDocs[0].id)
        return
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/public/docs?ref=${repoInfo.branch}`,
        )

        if (!response.ok) {
          throw new Error(`โหลดรายการเอกสารไม่สำเร็จ: ${response.status}`)
        }

        const files = await response.json()
        const markdownDocs = files
          .filter((item) => item.type === 'file' && /\.md$/i.test(item.name))
          .map((item) => ({
            id: item.name.toLowerCase(),
            title: fileNameToTitle(item.name),
            description: 'โหลดจาก GitHub repository ของคุณ',
            path: item.download_url,
          }))

        if (!cancelled && markdownDocs.length > 0) {
          setDocs(markdownDocs)
          setActiveDocId((current) =>
            markdownDocs.some((doc) => doc.id === current) ? current : markdownDocs[0].id,
          )
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(`ใช้รายการสำรองแทน: ${String(error.message ?? error)}`)
          setDocs(fallbackDocs)
          setActiveDocId((current) => current || fallbackDocs[0].id)
        }
      }
    }

    loadLibrary()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeDoc) {
      return
    }

    let cancelled = false

    async function loadMarkdown() {
      try {
        setStatus('กำลังโหลดไฟล์...')
        const source = activeDoc.path.startsWith('http')
          ? activeDoc.path
          : publicUrl(activeDoc.path)
        const response = await fetch(source)

        if (!response.ok) {
          throw new Error(`โหลดไฟล์ไม่สำเร็จ: ${response.status}`)
        }

        const markdown = await response.text()

        if (cancelled) {
          return
        }

        setContent(markdown)

        const storedProgress = Number(localStorage.getItem(progressKey(activeDoc.id)) ?? 0)
        const storedBookmarkRaw = localStorage.getItem(bookmarkKey(activeDoc.id))

        setSavedProgress(storedProgress)
        setBookmark(storedBookmarkRaw ? JSON.parse(storedBookmarkRaw) : null)
        setStatus('พร้อมอ่าน')
      } catch (error) {
        if (cancelled) {
          return
        }

        setContent(`# โหลดไฟล์ไม่ได้\n\n${String(error.message ?? error)}`)
        setSavedProgress(0)
        setBookmark(null)
        setStatus('เกิดปัญหาในการโหลดไฟล์')
      }
    }

    loadMarkdown()

    return () => {
      cancelled = true
    }
  }, [activeDoc])

  useEffect(() => {
    if (!content) {
      return
    }

    const frame = requestAnimationFrame(() => {
      restoreProgress(savedProgress)
    })

    return () => cancelAnimationFrame(frame)
  }, [content, savedProgress])

  useEffect(() => {
    if (!activeDoc) {
      return undefined
    }

    const handleScroll = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }

      saveTimerRef.current = window.setTimeout(() => {
        const progress = getReadingProgress()
        localStorage.setItem(progressKey(activeDoc.id), String(progress))
        setSavedProgress(progress)
      }, 120)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [activeDoc?.id, content])

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

  function restoreProgress(progress) {
    const article = articleRef.current

    if (!article) {
      return
    }

    const articleTop = article.offsetTop
    const articleHeight = article.offsetHeight
    const viewportHeight = window.innerHeight
    const scrollable = Math.max(articleHeight - viewportHeight, 1)
    const target = articleTop + (scrollable * progress) / 100

    window.scrollTo({ top: target, behavior: 'auto' })
  }

  function handleSaveBookmark() {
    const payload = {
      progress: getReadingProgress(),
      savedAt: new Date().toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }

    localStorage.setItem(bookmarkKey(activeDoc.id), JSON.stringify(payload))
    setBookmark(payload)
    setStatus('บันทึกจุดคั่นหน้าแล้ว')
  }

  function handleJumpToBookmark() {
    if (!bookmark) {
      return
    }

    restoreProgress(bookmark.progress)
    setStatus('กลับไปยังจุดคั่นหน้าแล้ว')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">ReadMD for iPad</p>
          <h1>อ่าน Markdown แบบต่อเนื่อง แล้วกลับมาอ่านต่อได้ทันที</h1>
          <p className="lede">
            เหมาะกับโน้ตเรียน, thesis log และเอกสารยาวที่อยากเปิดจาก iPad แล้วจำจุดที่อ่านค้างไว้
          </p>
        </div>

        <nav className="doc-list" aria-label="รายการเอกสาร">
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={doc.id === activeDoc.id ? 'doc-button active' : 'doc-button'}
              onClick={() => setActiveDocId(doc.id)}
            >
              <span>{doc.title}</span>
              <small>{doc.description}</small>
            </button>
          ))}
        </nav>

        <div className="panel">
          <p>อ่านไปแล้วประมาณ {savedProgress}%</p>
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${savedProgress}%` }} />
          </div>
          <div className="actions">
            <button type="button" onClick={handleSaveBookmark}>
              มาร์กจุดนี้
            </button>
            <button type="button" className="ghost" onClick={handleJumpToBookmark}>
              กลับไปจุดที่มาร์ก
            </button>
          </div>
          <p className="meta">
            {bookmark
              ? `Bookmark ล่าสุด: ${bookmark.progress}% · ${bookmark.savedAt}`
              : 'ยังไม่มี bookmark สำหรับเอกสารนี้'}
          </p>
          <p className="meta">สถานะ: {status}</p>
        </div>
      </aside>

      <main className="reader">
        <article ref={articleRef} className="markdown-body">
          <ReactMarkdown>{content || '# ยังไม่มีเอกสาร\n\nอัปไฟล์ `.md` เข้า `public/docs` บน GitHub ได้เลย'}</ReactMarkdown>
        </article>
      </main>
    </div>
  )
}

export default App
