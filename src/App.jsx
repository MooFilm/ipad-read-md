import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  defaultPrefs,
  deleteBook,
  deleteFolder,
  getLibrarySnapshot,
  putBook,
  putBooks,
  putFolder,
  putPrefs,
  replaceLibrary,
} from './libraryStore'

const DEFAULT_FOLDER_ID = 'folder-inbox'
const PASSAGE_SELECTOR = 'h1, h2, h3, h4, p, li, blockquote, pre'
const EMPTY_PASSAGE = {
  index: 0,
  heading: 'พร้อมอ่าน',
  excerpt: 'เริ่มเลื่อนอ่าน แล้วระบบจะจำตำแหน่งล่าสุดและช่วยคุณกลับมาจุดเดิมได้',
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createDefaultFolder() {
  return {
    id: DEFAULT_FOLDER_ID,
    name: 'ยังไม่จัดหมวด',
    parentId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fixed: true,
  }
}

function stripExtension(name) {
  return name.replace(/\.(md|markdown|txt)$/i, '')
}

function formatDate(timestamp) {
  if (!timestamp) {
    return 'ยังไม่เคยเปิดอ่าน'
  }

  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function formatCompactDate(timestamp) {
  if (!timestamp) {
    return '—'
  }

  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(timestamp))
}

function trimText(text, maxLength = 120) {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength).trimEnd()}...`
}

function getPassageNodes(article) {
  if (!article) {
    return []
  }

  return [...article.querySelectorAll(PASSAGE_SELECTOR)].filter((node) =>
    trimText(node.textContent, 24),
  )
}

function getPassageSnapshot(article, index) {
  const nodes = getPassageNodes(article)
  const target = nodes[index] ?? nodes[0]

  if (!target) {
    return EMPTY_PASSAGE
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

function detectCurrentPassage(article, scrollContainer) {
  const nodes = getPassageNodes(article)

  if (!nodes.length || !scrollContainer) {
    return EMPTY_PASSAGE
  }

  const containerRect = scrollContainer.getBoundingClientRect()
  const pivot = containerRect.top + scrollContainer.clientHeight * 0.28
  let activeIndex = 0

  nodes.forEach((node, index) => {
    if (node.getBoundingClientRect().top <= pivot) {
      activeIndex = index
    }
  })

  return getPassageSnapshot(article, activeIndex)
}

function flattenFolders(folders, parentId = null, depth = 0) {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .sort((left, right) => left.name.localeCompare(right.name, 'th'))
    .flatMap((folder) => [
      { ...folder, depth },
      ...flattenFolders(folders, folder.id, depth + 1),
    ])
}

function buildBreadcrumb(currentFolder, folderMap) {
  if (!currentFolder) {
    return []
  }

  const chain = []
  let pointer = currentFolder

  while (pointer) {
    chain.unshift(pointer)
    pointer = pointer.parentId ? folderMap.get(pointer.parentId) : null
  }

  return chain
}

function sortBooks(items, sortBy) {
  const books = [...items]

  if (sortBy === 'title') {
    return books.sort((left, right) => left.title.localeCompare(right.title, 'th'))
  }

  if (sortBy === 'progress') {
    return books.sort((left, right) => (right.progress ?? 0) - (left.progress ?? 0))
  }

  return books.sort((left, right) => (right.lastOpenedAt ?? 0) - (left.lastOpenedAt ?? 0))
}

function extractLead(content) {
  const firstText = trimText(
    content
      .replace(/^#+\s+/gm, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/[*_>#-]/g, ' '),
    140,
  )

  return firstText || 'หนังสือส่วนตัวพร้อมเปิดอ่านบน iPad'
}

function fileListToArray(fileList) {
  return Array.from(fileList ?? []).filter((file) => /\.(md|markdown|txt)$/i.test(file.name))
}

function App() {
  const [folders, setFolders] = useState([])
  const [books, setBooks] = useState([])
  const [prefs, setPrefs] = useState(defaultPrefs)
  const [storageMode, setStorageMode] = useState('indexedDB')
  const [view, setView] = useState('library')
  const [currentFolderId, setCurrentFolderId] = useState(DEFAULT_FOLDER_ID)
  const [activeBookId, setActiveBookId] = useState(null)
  const [status, setStatus] = useState('พร้อมเพิ่มหนังสือและจัดชั้นอ่านส่วนตัวของคุณ')
  const [isBooting, setIsBooting] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [folderDraft, setFolderDraft] = useState('')
  const [folderEditor, setFolderEditor] = useState({ open: false, mode: 'create', targetId: null })
  const [bookActionId, setBookActionId] = useState(null)
  const [bookMoveId, setBookMoveId] = useState(null)
  const [bookmarkPanelOpen, setBookmarkPanelOpen] = useState(false)
  const [readerPassage, setReaderPassage] = useState(EMPTY_PASSAGE)
  const [readerProgress, setReaderProgress] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const fileInputRef = useRef(null)
  const backupInputRef = useRef(null)
  const readerScrollRef = useRef(null)
  const articleRef = useRef(null)
  const saveTimerRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const lastScrollSampleRef = useRef(0)
  const toastTimerRef = useRef(null)

  const folderMap = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  )

  const activeBook = useMemo(
    () => books.find((book) => book.id === activeBookId) ?? null,
    [books, activeBookId],
  )

  const currentFolder = useMemo(
    () => folders.find((folder) => folder.id === currentFolderId) ?? null,
    [folders, currentFolderId],
  )

  const breadcrumb = useMemo(
    () => buildBreadcrumb(currentFolder, folderMap),
    [currentFolder, folderMap],
  )

  const folderTree = useMemo(() => flattenFolders(folders), [folders])

  const childFolders = useMemo(
    () =>
      folders
        .filter((folder) => folder.parentId === currentFolderId)
        .sort((left, right) => left.name.localeCompare(right.name, 'th')),
    [folders, currentFolderId],
  )

  const folderBooks = useMemo(() => {
    const filtered = books.filter((book) => book.folderId === currentFolderId)
    return sortBooks(filtered, prefs.sortBy)
  }, [books, currentFolderId, prefs.sortBy])

  const recentBooks = useMemo(
    () =>
      [...books]
        .filter((book) => book.lastOpenedAt)
        .sort((left, right) => (right.lastOpenedAt ?? 0) - (left.lastOpenedAt ?? 0))
        .slice(0, 6),
    [books],
  )

  const stats = useMemo(() => {
    const totalBooks = books.length
    const readingBooks = books.filter((book) => (book.progress ?? 0) > 0 && (book.progress ?? 0) < 98).length
    const finishedBooks = books.filter((book) => (book.progress ?? 0) >= 98).length
    const avgProgress = totalBooks
      ? Math.round(books.reduce((sum, book) => sum + (book.progress ?? 0), 0) / totalBooks)
      : 0

    return {
      totalBooks,
      readingBooks,
      finishedBooks,
      avgProgress,
      totalFolders: folders.length,
    }
  }, [books, folders.length])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setIsBooting(true)

      const snapshot = await getLibrarySnapshot()

      if (!active) {
        return
      }

      let nextFolders = snapshot.folders
      let nextBooks = snapshot.books

      if (!nextFolders.length) {
        const inbox = createDefaultFolder()
        nextFolders = [inbox]
        await putFolder(inbox)
      }

      if (!nextBooks.length) {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}docs/welcome.md`)

          if (response.ok) {
            const content = await response.text()
            const seedBook = {
              id: createId('book'),
              title: 'Welcome Guide',
              fileName: 'welcome.md',
              folderId: DEFAULT_FOLDER_ID,
              content,
              excerpt: extractLead(content),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              lastOpenedAt: null,
              lastReadAt: null,
              progress: 0,
              readerFontSize: snapshot.prefs.fontSize ?? defaultPrefs.fontSize,
              bookmarks: [],
            }

            nextBooks = [seedBook]
            await putBook(seedBook)
          }
        } catch {
          nextBooks = []
        }
      }

      setFolders(nextFolders)
      setBooks(nextBooks)
      setPrefs({ ...defaultPrefs, ...snapshot.prefs })
      setStorageMode(snapshot.storageMode)
      setCurrentFolderId(
        nextFolders.find((folder) => folder.id === DEFAULT_FOLDER_ID)?.id ?? nextFolders[0]?.id ?? DEFAULT_FOLDER_ID,
      )
      setIsBooting(false)
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    if (!toastMessage) {
      return
    }

    toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 2400)

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [toastMessage])

  useEffect(() => {
    if (!activeBook || view !== 'reader') {
      return
    }

    setReaderProgress(activeBook.progress ?? 0)
    setReaderPassage(EMPTY_PASSAGE)
    setBookmarkPanelOpen(false)

    const frame = requestAnimationFrame(() => {
      const scroller = readerScrollRef.current

      if (!scroller) {
        return
      }

      const max = Math.max(scroller.scrollHeight - scroller.clientHeight, 1)
      scroller.scrollTop = ((activeBook.progress ?? 0) / 100) * max
      setReaderPassage(detectCurrentPassage(articleRef.current, scroller))
    })

    return () => cancelAnimationFrame(frame)
  }, [activeBook, view])

  useEffect(() => {
    if (view !== 'reader' || !activeBook) {
      return undefined
    }

    const handleScroll = () => {
      if (scrollFrameRef.current) {
        return
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null

        const scroller = readerScrollRef.current

        if (!scroller) {
          return
        }

        const now = window.performance.now()

        if (now - lastScrollSampleRef.current < 72) {
          return
        }

        lastScrollSampleRef.current = now

        const max = Math.max(scroller.scrollHeight - scroller.clientHeight, 1)
        const progress = Math.round((scroller.scrollTop / max) * 100)
        const passage = detectCurrentPassage(articleRef.current, scroller)

        setReaderProgress(progress)
        setReaderPassage(passage)

        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current)
        }

        saveTimerRef.current = window.setTimeout(() => {
          updateBook(activeBook.id, {
            progress,
            lastReadAt: Date.now(),
          })
        }, 220)
      })
    }

    const scroller = readerScrollRef.current

    if (!scroller) {
      return undefined
    }

    scroller.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scroller.removeEventListener('scroll', handleScroll)

      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current)
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [view, activeBook])

  async function syncPrefs(nextPrefs) {
    setPrefs(nextPrefs)
    await putPrefs(nextPrefs)
  }

  async function syncFolders(nextFolders) {
    setFolders(nextFolders)
  }

  async function syncBooks(nextBooks) {
    setBooks(nextBooks)
  }

  async function updateBook(bookId, patch) {
    setBooks((previous) => {
      const nextBooks = previous.map((book) =>
        book.id === bookId
          ? {
              ...book,
              ...patch,
              updatedAt: Date.now(),
            }
          : book,
      )

      const changedBook = nextBooks.find((book) => book.id === bookId)

      if (changedBook) {
        void putBook(changedBook)
      }

      return nextBooks
    })
  }

  function showToast(message) {
    setToastMessage(message)
  }

  async function handleImportFiles(event) {
    const files = fileListToArray(event.target.files)

    if (!files.length) {
      return
    }

    setIsImporting(true)
    const targetFolderId = currentFolderId || DEFAULT_FOLDER_ID

    const incomingBooks = await Promise.all(
      files.map(async (file) => {
        const content = await file.text()

        return {
          id: createId('book'),
          title: stripExtension(file.name),
          fileName: file.name,
          folderId: targetFolderId,
          content,
          excerpt: extractLead(content),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastOpenedAt: null,
          lastReadAt: null,
          progress: 0,
          readerFontSize: prefs.fontSize,
          bookmarks: [],
        }
      }),
    )

    const duplicates = incomingBooks.filter((incoming) =>
      books.some(
        (book) =>
          book.folderId === incoming.folderId &&
          book.fileName.toLowerCase() === incoming.fileName.toLowerCase(),
      ),
    )

    const acceptedBooks = incomingBooks.filter(
      (incoming) => !duplicates.some((duplicate) => duplicate.id === incoming.id),
    )

    if (acceptedBooks.length) {
      const nextBooks = [...acceptedBooks, ...books]
      await putBooks(acceptedBooks)
      await syncBooks(nextBooks)
      showToast(`เพิ่มหนังสือ ${acceptedBooks.length} เล่มแล้ว`)
    }

    if (duplicates.length) {
      showToast(`ข้าม ${duplicates.length} ไฟล์ที่ชื่อซ้ำในโฟลเดอร์นี้`)
    }

    setStatus('นำเข้าไฟล์ใหม่เรียบร้อยแล้ว')
    setIsImporting(false)
    event.target.value = ''
  }

  function openFolderEditor(mode) {
    setFolderDraft(mode === 'rename' ? currentFolder?.name ?? '' : '')
    setFolderEditor({
      open: true,
      mode,
      targetId: mode === 'rename' ? currentFolder?.id ?? null : null,
    })
  }

  async function submitFolderEditor(event) {
    event.preventDefault()

    const name = folderDraft.trim()

    if (!name) {
      showToast('ตั้งชื่อโฟลเดอร์ก่อน')
      return
    }

    if (folderEditor.mode === 'rename' && currentFolder) {
      const updatedFolder = {
        ...currentFolder,
        name,
        updatedAt: Date.now(),
      }

      await putFolder(updatedFolder)
      await syncFolders(
        folders.map((folder) => (folder.id === updatedFolder.id ? updatedFolder : folder)),
      )
      setStatus(`เปลี่ยนชื่อโฟลเดอร์เป็น “${name}” แล้ว`)
    } else {
      const folder = {
        id: createId('folder'),
        name,
        parentId: currentFolderId ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fixed: false,
      }

      await putFolder(folder)
      await syncFolders([...folders, folder])
      setStatus(`สร้างโฟลเดอร์ “${name}” แล้ว`)
    }

    setFolderEditor({ open: false, mode: 'create', targetId: null })
    setFolderDraft('')
  }

  async function handleDeleteFolder() {
    if (!currentFolder || currentFolder.fixed) {
      return
    }

    const hasChildren = folders.some((folder) => folder.parentId === currentFolder.id)
    const hasBooks = books.some((book) => book.folderId === currentFolder.id)

    if (hasChildren || hasBooks) {
      showToast('ลบโฟลเดอร์ไม่ได้ ถ้ายังมีโฟลเดอร์ย่อยหรือหนังสืออยู่')
      return
    }

    if (!window.confirm(`ลบโฟลเดอร์ “${currentFolder.name}” ?`)) {
      return
    }

    await deleteFolder(currentFolder.id)
    await syncFolders(folders.filter((folder) => folder.id !== currentFolder.id))
    setCurrentFolderId(currentFolder.parentId ?? DEFAULT_FOLDER_ID)
    setStatus('ลบโฟลเดอร์แล้ว')
  }

  async function handleOpenBook(bookId) {
    setBookActionId(null)
    setView('reader')
    setActiveBookId(bookId)
    await updateBook(bookId, { lastOpenedAt: Date.now() })
  }

  async function handleDeleteBook(bookId) {
    const book = books.find((item) => item.id === bookId)

    if (!book) {
      return
    }

    if (!window.confirm(`ลบหนังสือ “${book.title}” ?`)) {
      return
    }

    await deleteBook(bookId)
    await syncBooks(books.filter((item) => item.id !== bookId))
    setBookActionId(null)

    if (activeBookId === bookId) {
      setView('library')
      setActiveBookId(null)
    }

    setStatus('ลบหนังสือแล้ว')
  }

  async function handleMoveBook(targetFolderId) {
    if (!bookMoveId || !targetFolderId) {
      return
    }

    await updateBook(bookMoveId, { folderId: targetFolderId })
    setBookMoveId(null)
    setBookActionId(null)
    setStatus('ย้ายหนังสือไปโฟลเดอร์ใหม่แล้ว')
  }

  async function handleExportBackup() {
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      folders,
      books,
      prefs,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `readshelf-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    showToast('ส่งออกแบ็กอัปแล้ว')
  }

  async function handleImportBackup(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const text = await file.text()

    try {
      const payload = JSON.parse(text)

      if (!Array.isArray(payload.folders) || !Array.isArray(payload.books)) {
        throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง')
      }

      if (!window.confirm('นำเข้าแบ็กอัปนี้และแทนที่คลังหนังสือทั้งหมดหรือไม่?')) {
        event.target.value = ''
        return
      }

      await replaceLibrary({
        folders: payload.folders,
        books: payload.books,
        prefs: { ...defaultPrefs, ...(payload.prefs ?? {}) },
      })

      await syncFolders(payload.folders)
      await syncBooks(payload.books)
      setPrefs({ ...defaultPrefs, ...(payload.prefs ?? {}) })
      setCurrentFolderId(payload.folders[0]?.id ?? DEFAULT_FOLDER_ID)
      setStatus('นำเข้าแบ็กอัปแล้ว')
      showToast('กู้คืนคลังหนังสือสำเร็จ')
    } catch (error) {
      showToast(`เปิดไฟล์สำรองไม่สำเร็จ: ${String(error.message ?? error)}`)
    }

    event.target.value = ''
  }

  async function handleSaveReadingPoint() {
    if (!activeBook) {
      return
    }

    await updateBook(activeBook.id, {
      progress: readerProgress,
      lastReadAt: Date.now(),
    })
    showToast(`จำตำแหน่งอ่านไว้ที่ ${readerProgress}% แล้ว`)
  }

  async function handleAddBookmark() {
    if (!activeBook) {
      return
    }

    const nextBookmarks = [
      {
        id: createId('bookmark'),
        progress: readerProgress,
        excerpt: readerPassage.excerpt || `ตำแหน่ง ${readerProgress}%`,
        heading: readerPassage.heading,
        createdAt: Date.now(),
      },
      ...(activeBook.bookmarks ?? []),
    ].sort((left, right) => left.progress - right.progress)

    await updateBook(activeBook.id, {
      bookmarks: nextBookmarks,
    })
    showToast('เพิ่มบุ๊กมาร์กแล้ว')
  }

  function jumpToProgress(progress) {
    const scroller = readerScrollRef.current

    if (!scroller) {
      return
    }

    const max = Math.max(scroller.scrollHeight - scroller.clientHeight, 1)
    scroller.scrollTo({ top: (progress / 100) * max, behavior: 'smooth' })
    setBookmarkPanelOpen(false)
  }

  async function handleDeleteBookmark(bookmarkId) {
    if (!activeBook) {
      return
    }

    await updateBook(activeBook.id, {
      bookmarks: (activeBook.bookmarks ?? []).filter((bookmark) => bookmark.id !== bookmarkId),
    })
  }

  async function adjustReaderFont(delta) {
    if (!activeBook) {
      return
    }

    const nextFontSize = Math.min(24, Math.max(15, (activeBook.readerFontSize ?? prefs.fontSize) + delta))
    await updateBook(activeBook.id, { readerFontSize: nextFontSize })
    await syncPrefs({ ...prefs, fontSize: nextFontSize })
  }

  function closeReader() {
    setView('library')
    setActiveBookId(null)
    setBookmarkPanelOpen(false)
    setReaderPassage(EMPTY_PASSAGE)
  }

  function renderFolderOption(option) {
    return (
      <option key={option.id} value={option.id}>
        {'\u00A0'.repeat(option.depth * 2)}
        {option.name}
      </option>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">ReadShelf Personal</p>
          <h1>ชั้นหนังสือส่วนตัวสำหรับ iPad ของคุณ</h1>
          <p className="header-copy">
            ทำงานได้ดีบน iPad Air 5 ด้วยปุ่มแตะง่าย ชั้นหนังสือเป็นหมวดชัด และข้อมูลเก็บในเครื่องอย่างเป็นระบบ
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={() => openFolderEditor('create')}>
            สร้างโฟลเดอร์
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? 'กำลังนำเข้า...' : 'เพิ่มหนังสือ'}
          </button>
          <button type="button" className="ghost-button" onClick={handleExportBackup}>
            ส่งออกแบ็กอัป
          </button>
          <button type="button" className="primary-button" onClick={() => backupInputRef.current?.click()}>
            นำเข้าแบ็กอัป
          </button>
        </div>
      </header>

      <section className="stats-bar">
        <article className="stat-card">
          <strong>{stats.totalBooks}</strong>
          <span>หนังสือทั้งหมด</span>
        </article>
        <article className="stat-card">
          <strong>{stats.totalFolders}</strong>
          <span>โฟลเดอร์</span>
        </article>
        <article className="stat-card">
          <strong>{stats.readingBooks}</strong>
          <span>กำลังอ่าน</span>
        </article>
        <article className="stat-card">
          <strong>{stats.finishedBooks}</strong>
          <span>อ่านจบแล้ว</span>
        </article>
        <article className="stat-card">
          <strong>{stats.totalBooks ? `${stats.avgProgress}%` : '—'}</strong>
          <span>เฉลี่ยความคืบหน้า</span>
        </article>
        <article className="stat-card">
          <strong>{storageMode}</strong>
          <span>โหมดจัดเก็บ</span>
        </article>
      </section>

      <main className="app-main">
        <aside className="folder-panel">
          <div className="panel-header">
            <p className="eyebrow">Folders</p>
            <h2>ผังชั้นหนังสือ</h2>
          </div>

          <nav className="folder-tree">
            {folderTree.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`folder-item ${folder.id === currentFolderId ? 'active' : ''}`}
                style={{ '--depth': folder.depth }}
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <span>{folder.name}</span>
                <small>{books.filter((book) => book.folderId === folder.id).length}</small>
              </button>
            ))}
          </nav>

          <div className="panel-footer">
            <p>{status}</p>
          </div>
        </aside>

        <section className="library-panel">
          <div className="panel-header panel-header-spread">
            <div>
              <p className="eyebrow">Now Browsing</p>
              <h2>{currentFolder?.name ?? 'กำลังโหลดโฟลเดอร์'}</h2>
              <div className="breadcrumb">
                {breadcrumb.map((folder, index) => (
                  <span key={folder.id}>
                    {folder.name}
                    {index < breadcrumb.length - 1 ? ' / ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="folder-actions">
              <select
                value={prefs.sortBy}
                onChange={(event) => syncPrefs({ ...prefs, sortBy: event.target.value })}
              >
                <option value="recent">เรียงตามล่าสุด</option>
                <option value="title">เรียงตามชื่อ</option>
                <option value="progress">เรียงตามความคืบหน้า</option>
              </select>
              <button type="button" className="ghost-button" onClick={() => openFolderEditor('create')}>
                โฟลเดอร์ย่อย
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => openFolderEditor('rename')}
                disabled={!currentFolder || currentFolder.fixed}
              >
                เปลี่ยนชื่อ
              </button>
              <button
                type="button"
                className="ghost-button danger"
                onClick={handleDeleteFolder}
                disabled={!currentFolder || currentFolder.fixed}
              >
                ลบโฟลเดอร์
              </button>
            </div>
          </div>

          <section className="recent-section">
            <div className="section-heading">
              <p className="eyebrow">Continue Reading</p>
              <h3>เล่มที่กำลังอ่านต่อ</h3>
            </div>
            <div className="recent-row">
              {recentBooks.length ? (
                recentBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="recent-card"
                    onClick={() => handleOpenBook(book.id)}
                  >
                    <strong>{book.title}</strong>
                    <p>{trimText(book.excerpt, 90)}</p>
                    <div className="recent-meta">
                      <span>{book.progress ?? 0}%</span>
                      <small>{formatCompactDate(book.lastOpenedAt)}</small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="placeholder-card">ยังไม่มีเล่มที่เปิดอ่านล่าสุด</div>
              )}
            </div>
          </section>

          <section className="subfolder-section">
            <div className="section-heading">
              <p className="eyebrow">Subfolders</p>
              <h3>โฟลเดอร์ย่อยในชั้นนี้</h3>
            </div>
            <div className="folder-grid">
              {childFolders.length ? (
                childFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className="folder-card"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <strong>{folder.name}</strong>
                    <p>{books.filter((book) => book.folderId === folder.id).length} เล่มในโฟลเดอร์นี้</p>
                  </button>
                ))
              ) : (
                <div className="placeholder-card">ยังไม่มีโฟลเดอร์ย่อยในชั้นนี้</div>
              )}
            </div>
          </section>

          <section className="book-section">
            <div className="section-heading">
              <p className="eyebrow">Shelf</p>
              <h3>หนังสือในโฟลเดอร์นี้</h3>
            </div>

            {isBooting ? (
              <div className="placeholder-card">กำลังเตรียมชั้นหนังสือ...</div>
            ) : folderBooks.length ? (
              <div className="book-grid">
                {folderBooks.map((book, index) => (
                  <article key={book.id} className={`book-card tone-${index % 4}`}>
                    <button type="button" className="book-open" onClick={() => handleOpenBook(book.id)}>
                      <span className="book-spine">{book.fileName.replace(/\.(md|markdown|txt)$/i, '').slice(0, 18)}</span>
                      <div className="book-card-body">
                        <p className="book-kicker">{formatDate(book.lastOpenedAt)}</p>
                        <h4>{book.title}</h4>
                        <p>{trimText(book.excerpt, 120)}</p>
                        <div className="progress-line">
                          <span style={{ width: `${book.progress ?? 0}%` }} />
                        </div>
                        <div className="book-meta">
                          <small>{book.bookmarks?.length ?? 0} bookmarks</small>
                          <strong>{book.progress ?? 0}%</strong>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="book-menu"
                      onClick={() => setBookActionId((current) => (current === book.id ? null : book.id))}
                    >
                      •••
                    </button>

                    {bookActionId === book.id ? (
                      <div className="book-sheet">
                        <button type="button" onClick={() => handleOpenBook(book.id)}>
                          เปิดอ่าน
                        </button>
                        <button type="button" onClick={() => setBookMoveId(book.id)}>
                          ย้ายโฟลเดอร์
                        </button>
                        <button type="button" className="danger" onClick={() => handleDeleteBook(book.id)}>
                          ลบหนังสือ
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="placeholder-card">
                โฟลเดอร์นี้ยังไม่มีหนังสือ กด “เพิ่มหนังสือ” เพื่อ import ไฟล์ `.md`
              </div>
            )}
          </section>
        </section>
      </main>

      {view === 'reader' && activeBook ? (
        <div className="reader-overlay">
          <section className="reader-panel">
            <header className="reader-topbar">
              <button type="button" className="ghost-button" onClick={closeReader}>
                กลับชั้นหนังสือ
              </button>
              <div className="reader-heading">
                <p className="eyebrow">Now Reading</p>
                <h2>{activeBook.title}</h2>
                <span>{currentFolder?.name ?? 'ชั้นหนังสือ'}</span>
              </div>
              <div className="reader-tools">
                <button type="button" className="ghost-button" onClick={() => adjustReaderFont(-1)}>
                  A-
                </button>
                <button type="button" className="ghost-button" onClick={() => adjustReaderFont(1)}>
                  A+
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setBookmarkPanelOpen((current) => !current)}
                >
                  บุ๊กมาร์ก
                </button>
              </div>
            </header>

            <div className="reader-progress-track">
              <span style={{ width: `${readerProgress}%` }} />
            </div>

            <div className="reader-content-wrap">
              <aside className="reader-sidecard">
                <p className="eyebrow">Reading Status</p>
                <h3>{readerPassage.heading}</h3>
                <p>{readerPassage.excerpt}</p>
                <div className="reader-side-meta">
                  <span>{readerProgress}%</span>
                  <small>อัปเดตล่าสุด {formatDate(activeBook.lastReadAt)}</small>
                </div>
              </aside>

              <div className="reader-scroll" ref={readerScrollRef}>
                <article
                  ref={articleRef}
                  className="markdown-body"
                  style={{ '--reader-font-size': `${activeBook.readerFontSize ?? prefs.fontSize}px` }}
                >
                  <ReactMarkdown>{activeBook.content}</ReactMarkdown>
                </article>
              </div>
            </div>

            <footer className="reader-bottom">
              <div className="reader-bottom-copy">
                <p className="eyebrow">ตำแหน่งอ่านล่าสุด</p>
                <strong>{readerPassage.heading}</strong>
                <small>{trimText(readerPassage.excerpt, 100)}</small>
              </div>
              <div className="reader-bottom-actions">
                <button type="button" className="ghost-button" onClick={handleAddBookmark}>
                  บุ๊กมาร์กตำแหน่งนี้
                </button>
                <button type="button" className="primary-button" onClick={handleSaveReadingPoint}>
                  บันทึกว่าอ่านถึงนี่
                </button>
              </div>
            </footer>

            {bookmarkPanelOpen ? (
              <div className="bookmark-panel">
                <div className="section-heading">
                  <p className="eyebrow">Bookmarks</p>
                  <h3>จุดที่คุณมาร์กไว้</h3>
                </div>
                <div className="bookmark-list">
                  {(activeBook.bookmarks ?? []).length ? (
                    activeBook.bookmarks.map((bookmark) => (
                      <article key={bookmark.id} className="bookmark-item">
                        <button type="button" className="bookmark-open" onClick={() => jumpToProgress(bookmark.progress)}>
                          <strong>{bookmark.heading}</strong>
                          <p>{bookmark.excerpt}</p>
                          <small>{bookmark.progress}% • {formatDate(bookmark.createdAt)}</small>
                        </button>
                        <button
                          type="button"
                          className="book-menu danger"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                        >
                          ลบ
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="placeholder-card">ยังไม่มีบุ๊กมาร์กสำหรับเล่มนี้</div>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {folderEditor.open ? (
        <div className="modal-overlay" onClick={() => setFolderEditor({ open: false, mode: 'create', targetId: null })}>
          <form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={submitFolderEditor}>
            <p className="eyebrow">{folderEditor.mode === 'rename' ? 'Rename Folder' : 'Create Folder'}</p>
            <h3>{folderEditor.mode === 'rename' ? 'เปลี่ยนชื่อโฟลเดอร์' : 'สร้างโฟลเดอร์ใหม่'}</h3>
            <input
              type="text"
              value={folderDraft}
              onChange={(event) => setFolderDraft(event.target.value)}
              placeholder="ชื่อโฟลเดอร์"
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setFolderEditor({ open: false, mode: 'create', targetId: null })}>
                ยกเลิก
              </button>
              <button type="submit" className="primary-button">
                บันทึก
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {bookMoveId ? (
        <div className="modal-overlay" onClick={() => setBookMoveId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Move Book</p>
            <h3>ย้ายหนังสือไปโฟลเดอร์อื่น</h3>
            <select defaultValue="" onChange={(event) => handleMoveBook(event.target.value)}>
              <option value="" disabled>
                เลือกโฟลเดอร์ปลายทาง
              </option>
              {folderTree.map(renderFolderOption)}
            </select>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setBookMoveId(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? <div className="toast show">{toastMessage}</div> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        multiple
        className="hidden-input"
        onChange={handleImportFiles}
      />
      <input
        ref={backupInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden-input"
        onChange={handleImportBackup}
      />
    </div>
  )
}

export default App
