import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const fallbackDocs = [
  {
    id: 'welcome',
    title: 'Welcome Guide',
    description: 'คู่มือทดลองระบบอ่านต่อและมาร์กจุดสำคัญ',
    folderPath: '',
    folderLabel: 'เริ่มต้นใช้งาน',
    relativePath: 'welcome.md',
    path: 'docs/welcome.md',
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

function buildDocRecord({ id, title, description, relativePath, sourcePath, rawUrl }) {
  const normalizedPath = relativePath.replace(/^docs\//, '')
  const segments = normalizedPath.split('/')
  const fileName = segments.at(-1) ?? normalizedPath
  const folderPath = segments.slice(0, -1).join('/')

  return {
    id,
    title,
    description,
    folderPath,
    folderLabel: folderPathToLabel(folderPath),
    relativePath: normalizedPath,
    fileName,
    path: rawUrl ?? sourcePath,
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

function App() {
  const [docs, setDocs] = useState(fallbackDocs)
  const [view, setView] = useState('library')
  const [activeDocId, setActiveDocId] = useState(null)
  const [content, setContent] = useState('')
  const [savedProgress, setSavedProgress] = useState(0)
  const [bookmark, setBookmark] = useState(null)
  const [status, setStatus] = useState('เลือกไฟล์ที่อยากอ่านได้เลย')
  const [currentPassage, setCurrentPassage] = useState(emptyPassage)
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [libraryRefreshToken, setLibraryRefreshToken] = useState(0)
  const articleRef = useRef(null)
  const saveTimerRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const pendingRestoreRef = useRef(null)
  const currentPassageRef = useRef(emptyPassage)
  const savedProgressRef = useRef(0)
  const lastScrollSampleRef = useRef(0)

  const activeDoc = useMemo(
    () => docs.find((doc) => doc.id === activeDocId) ?? null,
    [docs, activeDocId],
  )

  const libraryDocs = useMemo(
    () =>
      docs.map((doc, index) => ({
        ...doc,
        progress: readStoredProgress(doc.id),
        bookmark: readStoredBookmark(doc.id),
        shelfTone: index % 4,
      })),
    [docs, libraryRefreshToken],
  )

  const libraryGroups = useMemo(() => {
    const groups = new Map()

    libraryDocs.forEach((doc) => {
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
  }, [libraryDocs])

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
          setDocs(fallbackDocs)
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
              id: relativePath.toLowerCase(),
              title: fileNameToTitle(relativePath.split('/').at(-1) ?? relativePath),
              description: 'เปิดอ่านจากคลัง Markdown ใน GitHub ของคุณ',
              relativePath,
              sourcePath: `docs/${relativePath}`,
              rawUrl: `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${repoInfo.branch}/${item.path}`,
            })
          })
          .sort((left, right) => left.title.localeCompare(right.title))

        if (!cancelled) {
          setDocs(markdownDocs.length > 0 ? markdownDocs : fallbackDocs)
          setStatus('เลือกเอกสารจากชั้นหนังสือแล้วเริ่มอ่านต่อได้ทันที')
        }
      } catch (error) {
        if (!cancelled) {
          setDocs(fallbackDocs)
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

  return (
    <div className={view === 'library' ? 'app-shell library-shell' : 'app-shell reader-shell'}>
      {view === 'library' ? (
        <main className="library-view">
          <section className="library-hero">
            <div className="library-copy">
              <p className="eyebrow">ReadMD Library</p>
              <h1>คลังหนังสือ Markdown สำหรับเปิดบน iPad แล้วอ่านต่อได้ลื่นกว่าเดิม</h1>
              <p className="library-lede">
                เลือกไฟล์จากชั้นหนังสือด้านล่าง แล้วค่อยเข้าโหมดอ่านเต็มหน้าที่มีปุ่มมาร์กลอยและจำจุดอ่านให้เอง
              </p>
              <div className="library-meta">
                <span>{libraryDocs.length} ไฟล์พร้อมอ่าน</span>
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
                <strong>Flow ใหม่</strong>
                <p>ชั้นหนังสือก่อน แล้วค่อยเข้าสู่ reader ที่มี HUD ลอยตามสายตา</p>
              </div>
            </div>
          </section>

          <section className="library-grid" aria-label="ชั้นหนังสือ Markdown">
          {isLoadingLibrary ? (
            <article className="book-card loading-card">
              <p>กำลังโหลดรายการหนังสือจากคลัง GitHub...</p>
            </article>
          ) : (
            libraryGroups.map((group) => (
              <section key={group.key} className="shelf-group">
                <div className="shelf-heading">
                  <p className="eyebrow">Shelf</p>
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
                      <span className="book-spine">.md</span>
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
                          <strong>เปิดอ่าน</strong>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
          </section>
        </main>
      ) : (
        <main className="reader-view">
          <header className="reader-topbar">
            <button type="button" className="back-button" onClick={backToLibrary}>
              กลับไปชั้นหนังสือ
            </button>
            <div className="reader-title">
              <p className="eyebrow">Now Reading</p>
              <h1>{activeDoc?.title ?? 'กำลังเปิดไฟล์'}</h1>
            </div>
            <div className="reader-chip">
              <span>{savedProgress}%</span>
              <small>อ่านถึงตรงนี้แล้ว</small>
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
                {bookmark?.excerpt ?? 'ยังไม่มีจุดมาร์กสำหรับไฟล์นี้ กดปุ่มด้านล่างเมื่อถึงช่วงที่อยากกลับมาอ่าน'}
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
