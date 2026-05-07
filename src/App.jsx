import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  defaultPrefs,
  deleteBook,
  deleteFolder,
  getLibrarySnapshot,
  normalizePrefs,
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
const STARTER_GUIDE_MARKDOWN = `# Welcome Guide

ReadShelf Personal เวอร์ชันนี้ออกแบบมาให้ใช้เหมือนแอปส่วนตัวบน iPad โดยตรง

## ข้อมูลของคุณอยู่ที่ไหน

- ตัวโปรแกรมเปิดผ่าน GitHub Pages ได้
- ค่าอ่าน (progress, bookmark) จะเก็บอยู่ในเบราว์เซอร์ของเครื่องนี้
- ถ้าไม่เปิด GitHub Cloud หนังสือที่คุณ import จะอยู่ในเครื่องนี้เท่านั้น
- ถ้าเปิด GitHub Cloud ไฟล์จะถูกอัปโหลดไปที่ public/docs เพื่อซิงก์ข้ามอุปกรณ์
- ถ้าใส่ค่าใน readshelf.config.json ระบบจะซิงก์แบบอ่านอย่างเดียวให้ทันทีโดยไม่ต้องตั้งค่าในแอป

## GitHub Cloud

1. ถ้า repo เป็น public ให้ใส่ค่าใน readshelf.config.json เพื่อซิงก์แบบอ่านอย่างเดียว
2. ถ้าต้องการอัปโหลด ให้เปิดโหมดอัปโหลดแล้วใส่ token ที่มีสิทธิ์เขียน
3. ถ้าโหมดซิงก์อัตโนมัติ ระบบจะดึงไฟล์เมื่อเปิดแอปหรือกลับมาใช้งาน (โหมดกดซิงก์เองใช้ปุ่ม **ซิงก์ GitHub**)

## เริ่มต้นใช้งาน

1. กดปุ่ม **เพิ่มหนังสือ**
2. เลือกไฟล์ .md จากเครื่องของคุณ
3. ถ้าต้องการจัดหมวด ให้สร้างโฟลเดอร์ก่อนแล้วค่อย import

## สิ่งสำคัญที่ควรจำ

- ถ้าล้างข้อมูลเว็บไซต์ของเบราว์เซอร์ ข้อมูลในเครื่องนี้อาจหาย
- ควรใช้ปุ่ม **ส่งออกแบ็กอัป** เป็นระยะ
- ถ้าต้องการย้ายไปเครื่องใหม่ ให้ใช้ไฟล์แบ็กอัปแล้วค่อย **นำเข้าแบ็กอัป**

## ใช้บน iPad ให้ลื่นที่สุด

- เปิดผ่าน Safari
- กด Share > Add to Home Screen
- ใช้แนวตั้งตอนอ่านยาว และแนวนอนตอนจัดโฟลเดอร์หรือเลือกหนังสือ
`
const STORAGE_MODE_LABEL = {
  indexedDB: 'IndexedDB',
  localStorage: 'localStorage',
}
const MARKDOWN_FILE_PATTERN = /\.(md|markdown|txt)$/i
const APP_CONFIG_FILE = 'readshelf.config.json'
const AUTO_SYNC_MIN_INTERVAL = 60 * 1000

function normalizeAppConfig(config = {}) {
  const github = config?.github ?? {}
  const repo = typeof github.repo === 'string' ? github.repo.trim() : ''
  const rootPath =
    typeof github.rootPath === 'string' && github.rootPath.trim()
      ? github.rootPath.trim()
      : defaultPrefs.github.rootPath
  const syncMode = github.syncMode === 'auto' ? 'auto' : 'manual'
  const uploadEnabled = Boolean(github.uploadEnabled)

  return {
    github: {
      repo,
      rootPath,
      syncMode,
      uploadEnabled,
    },
  }
}

async function fetchAppConfig() {
  if (typeof fetch !== 'function') {
    return null
  }

  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const configUrl = `${normalizedBase}${APP_CONFIG_FILE}`

  try {
    const res = await fetch(configUrl, { cache: 'no-store' })
    if (!res.ok) {
      return null
    }
    const data = await res.json()
    const normalized = normalizeAppConfig(data)
    if (!normalized.github.repo) {
      return null
    }
    return normalized
  } catch {
    return null
  }
}

function isSameCalendarDay(leftValue, rightValue) {
  if (!leftValue || !rightValue) {
    return false
  }

  const left = new Date(leftValue)
  const right = new Date(rightValue)

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function createBackupPayload(folders, books, prefs, exportedAt) {
  return {
    version: 1,
    exportedAt,
    folders,
    books,
    prefs,
  }
}

function buildBackupFileName(extension = 'json', date = new Date()) {
  return `readshelf-backup-${date.toISOString().slice(0, 10)}.${extension}`
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

function createStarterBook(fontSize) {
  const content = STARTER_GUIDE_MARKDOWN

  return {
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
    readerFontSize: fontSize ?? defaultPrefs.fontSize,
    bookmarks: [],
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

function getFolderPathSegments(folderId, folderMap, rootId = DEFAULT_FOLDER_ID) {
  const segments = []
  let pointer = folderMap.get(folderId)

  while (pointer) {
    if (pointer.id !== rootId) {
      const cleaned = sanitizePathSegment(pointer.name)
      if (cleaned) {
        segments.unshift(cleaned)
      }
    }
    pointer = pointer.parentId ? folderMap.get(pointer.parentId) : null
  }

  return segments
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
  return Array.from(fileList ?? []).filter((file) => MARKDOWN_FILE_PATTERN.test(file.name))
}

function sanitizePathSegment(value) {
  return (value ?? '')
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeToLowerCase(value) {
  return String(value ?? '').toLocaleLowerCase()
}

function ensureFileExtension(fileName) {
  if (!fileName) {
    return 'untitled.md'
  }

  return MARKDOWN_FILE_PATTERN.test(fileName) ? fileName : `${fileName}.md`
}

function sanitizeFileName(fileName) {
  const cleaned = sanitizePathSegment(fileName.split(/[\\/]/).pop() ?? '')
  return ensureFileExtension(cleaned)
}

function buildGithubPath(rootPath, folders, fileName) {
  return [rootPath, ...folders.filter(Boolean), fileName].filter(Boolean).join('/')
}

function encodeGithubPath(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value ?? '')
  const base64ChunkSize = 0x8000
  let binary = ''

  for (let index = 0; index < bytes.length; index += base64ChunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + base64ChunkSize))
  }

  return btoa(binary)
}

function stripRootPath(path, rootPath) {
  const normalizedRoot = rootPath.replace(/^\/+|\/+$/g, '')
  const normalizedPath = path.replace(/^\/+|\/+$/g, '')
  if (normalizedPath.startsWith(`${normalizedRoot}/`)) {
    return normalizedPath.slice(normalizedRoot.length + 1)
  }
  if (normalizedPath === normalizedRoot) {
    return ''
  }
  return null
}

function buildGithubHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function parseGithubRepo(input) {
  const cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '')
  const ghMatch = cleaned.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/)
  if (ghMatch) return { owner: ghMatch[1], repo: ghMatch[2] }
  const plainMatch = cleaned.match(/^([^/\s]+)\/([^/\s]+)$/)
  if (plainMatch) return { owner: plainMatch[1], repo: plainMatch[2] }
  return null
}

async function fetchGithubFileTree(owner, repo, rootPath, token) {
  const headers = buildGithubHeaders(token)

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
  if (!repoRes.ok) {
    const msg =
      repoRes.status === 404
        ? 'ไม่พบ repo หรือ repo เป็น private (ต้องใส่ token)'
        : `GitHub API Error ${repoRes.status}`
    throw new Error(msg)
  }
  const repoData = await repoRes.json()

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`,
    { headers },
  )
  if (!treeRes.ok) throw new Error(`โหลดโครงสร้างไฟล์ไม่ได้: ${treeRes.status}`)
  const treeData = await treeRes.json()

  const normalizedRoot = rootPath.replace(/^\/+|\/+$/g, '')

  return (treeData.tree ?? [])
    .filter((item) => item.type === 'blob' && MARKDOWN_FILE_PATTERN.test(item.path))
    .filter((item) => item.path === normalizedRoot || item.path.startsWith(`${normalizedRoot}/`))
    .map((item) => ({ path: item.path, sha: item.sha }))
    .sort((left, right) => left.path.localeCompare(right.path, 'en'))
}

async function fetchGithubFileMeta(owner, repo, filePath, token) {
  const headers = buildGithubHeaders(token)
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubPath(filePath)}`,
    { headers },
  )
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error(`ตรวจสอบไฟล์บน GitHub ไม่สำเร็จ (${res.status})`)
  }
  const data = await res.json()
  if (Array.isArray(data)) {
    return { sha: null, isDirectory: true }
  }
  return { sha: data.sha ?? null, isDirectory: false }
}

async function fetchGithubFileContent(owner, repo, filePath, token) {
  const headers = buildGithubHeaders(token)

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubPath(filePath)}`,
    { headers },
  )
  if (!res.ok) throw new Error(`โหลดไฟล์ไม่ได้ (${res.status}): ${filePath}`)
  const data = await res.json()

  if (data.encoding === 'base64' && data.content) {
    return { content: atob(data.content.replace(/\n/g, '')), sha: data.sha ?? null }
  }

  if (data.download_url) {
    const rawHeaders = token ? { Authorization: `Bearer ${token}` } : {}
    const rawRes = await fetch(data.download_url, { headers: rawHeaders })
    if (!rawRes.ok) throw new Error(`โหลดเนื้อหาไฟล์ไม่ได้: ${filePath}`)
    return { content: await rawRes.text(), sha: data.sha ?? null }
  }

  throw new Error(`ไม่สามารถอ่านเนื้อหาของไฟล์: ${filePath}`)
}

async function uploadGithubFile({ owner, repo, filePath, content, message, token, sha }) {
  const headers = {
    ...buildGithubHeaders(token),
    'Content-Type': 'application/json',
  }
  const encodedContent = encodeBase64Utf8(content)
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubPath(filePath)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: encodedContent,
        sha: sha ?? undefined,
      }),
    },
  )

  if (!res.ok) {
    throw new Error(`อัปโหลดไฟล์ไม่สำเร็จ (${res.status})`)
  }

  const data = await res.json()
  return data.content?.sha ?? null
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
  const [helpOpen, setHelpOpen] = useState(false)
  const [readerPassage, setReaderPassage] = useState(EMPTY_PASSAGE)
  const [readerProgress, setReaderProgress] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const [ghSyncing, setGhSyncing] = useState(false)
  const [ghSyncError, setGhSyncError] = useState('')
  const [initialSyncQueued, setInitialSyncQueued] = useState(false)

  const fileInputRef = useRef(null)
  const backupInputRef = useRef(null)
  const readerScrollRef = useRef(null)
  const articleRef = useRef(null)
  const saveTimerRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const lastScrollSampleRef = useRef(0)
  const lastPassageSampleRef = useRef(0)
  const lastProgressRef = useRef(0)
  const toastTimerRef = useRef(null)
  const autoSyncRef = useRef(false)
  const lastAutoSyncAtRef = useRef(0)

  const folderMap = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  )
  const githubPrefs = prefs.github ?? defaultPrefs.github
  const githubRepoKey = import.meta.env.VITE_GITHUB_REPO?.trim() || (githubPrefs.repo?.trim() ?? '')
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN?.trim() || (githubPrefs.token?.trim() ?? '')
  const githubRootPath = import.meta.env.VITE_GITHUB_ROOT_PATH?.trim() || githubPrefs.rootPath || defaultPrefs.github.rootPath
  const githubUploadRequested = true
  const githubUploadReady = Boolean(githubToken)

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

  const latestReadingBook = useMemo(() => recentBooks[0] ?? null, [recentBooks])

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

  const backupStatus = useMemo(() => {
    if (!prefs.lastBackupAt) {
      return 'ยังไม่เคยส่งออกแบ็กอัป'
    }

    return `สำรองล่าสุด ${formatDate(prefs.lastBackupAt)}`
  }, [prefs.lastBackupAt])

  const storageSummary = useMemo(() => {
    if (storageMode === 'localStorage') {
      return {
        title: 'โหมดสำรอง',
        detail: 'เบราว์เซอร์นี้ใช้ localStorage อยู่ จึงควรแบ็กอัปบ่อยกว่าปกติ',
      }
    }

    return {
      title: 'โหมดหลัก',
      detail: 'เบราว์เซอร์นี้เก็บข้อมูลใน IndexedDB เพื่อรองรับหนังสือและโฟลเดอร์ได้มากกว่าเดิม',
    }
  }, [storageMode])

  const githubSummary = useMemo(() => {
    if (!githubRepoKey) {
      return 'ยังไม่ได้เชื่อมต่อ GitHub'
    }

    let uploadLabel = 'อ่านอย่างเดียว'
    if (githubUploadRequested) {
      uploadLabel = githubUploadReady ? 'พร้อมอัปโหลด' : 'รอใส่ token เพื่ออัปโหลด'
    }

    if (!githubPrefs.lastSyncedAt) {
      return `${uploadLabel} • ยังไม่เคยซิงก์จาก GitHub`
    }

    return `${uploadLabel} • ซิงก์ล่าสุด ${formatDate(githubPrefs.lastSyncedAt)}`
  }, [githubRepoKey, githubPrefs.lastSyncedAt, githubUploadReady, githubUploadRequested])

  const needsBackupReminder = useMemo(() => {
    if (!books.length) {
      return false
    }

    const now = Date.now()

    return (
      !isSameCalendarDay(prefs.lastBackupAt, now) &&
      !isSameCalendarDay(prefs.lastBackupReminderDismissedAt, now)
    )
  }, [books.length, prefs.lastBackupAt, prefs.lastBackupReminderDismissedAt])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setIsBooting(true)

      const [snapshot, appConfig] = await Promise.all([getLibrarySnapshot(), fetchAppConfig()])

      if (!active) {
        return
      }

      let nextPrefs = normalizePrefs(snapshot.prefs)
      let configApplied = false
      let prefsChanged = false

      const hasStoredRepo = Boolean(nextPrefs.github.repo)
      const configAlreadyApplied = Boolean(nextPrefs.github.configApplied)
      const shouldApplyConfigFromFile = Boolean(appConfig?.github?.repo) && !configAlreadyApplied && !hasStoredRepo

      if (!configAlreadyApplied && (hasStoredRepo || shouldApplyConfigFromFile)) {
        nextPrefs = normalizePrefs({
          ...nextPrefs,
          github: {
            ...nextPrefs.github,
            ...(shouldApplyConfigFromFile
              ? {
                  repo: appConfig.github.repo,
                  rootPath: appConfig.github.rootPath,
                  syncMode: appConfig.github.syncMode,
                  uploadEnabled: appConfig.github.uploadEnabled,
                  lastSyncedAt: null,
                }
              : {}),
            configApplied: true,
          },
        })
        prefsChanged = true
        configApplied = shouldApplyConfigFromFile
      }

      if (prefsChanged) {
        await putPrefs(nextPrefs)
      }

      let nextFolders = snapshot.folders
      let nextBooks = snapshot.books

      if (!nextFolders.length) {
        const inbox = createDefaultFolder()
        nextFolders = [inbox]
        await putFolder(inbox)
      }

      if (!nextBooks.length) {
        const seedBook = createStarterBook(nextPrefs.fontSize ?? defaultPrefs.fontSize)
        nextBooks = [seedBook]
        await putBook(seedBook)
      }

      setFolders(nextFolders)
      setBooks(nextBooks)
      setPrefs(nextPrefs)
      setStorageMode(snapshot.storageMode)
      setCurrentFolderId(
        nextFolders.find((folder) => folder.id === DEFAULT_FOLDER_ID)?.id ?? nextFolders[0]?.id ?? DEFAULT_FOLDER_ID,
      )
      const shouldRunInitialSync = configApplied && nextPrefs.github.syncMode === 'manual'
      if (shouldRunInitialSync) {
        setInitialSyncQueued(true)
      }
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

    lastScrollSampleRef.current = 0
    lastPassageSampleRef.current = 0
    lastProgressRef.current = activeBook.progress ?? 0
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
  }, [activeBookId, view])

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

        if (now - lastScrollSampleRef.current < 120) {
          return
        }

        lastScrollSampleRef.current = now

        const max = Math.max(scroller.scrollHeight - scroller.clientHeight, 1)
        const progress = Math.round((scroller.scrollTop / max) * 100)

        if (progress !== lastProgressRef.current) {
          lastProgressRef.current = progress
          setReaderProgress(progress)
        }

        if (now - lastPassageSampleRef.current > 420) {
          lastPassageSampleRef.current = now
          setReaderPassage(detectCurrentPassage(articleRef.current, scroller))
        }

        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current)
        }

        saveTimerRef.current = window.setTimeout(() => {
          updateBook(activeBookId, {
            progress,
            lastReadAt: Date.now(),
          })
        }, 900)
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
  }, [view, activeBookId])

  async function syncPrefs(nextPrefs) {
    const normalized = normalizePrefs(nextPrefs)
    setPrefs(normalized)
    await putPrefs(normalized)
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

  const showToast = useCallback((message) => {
    setToastMessage(message)
  }, [])

  function getGithubConfig() {
    if (!githubRepoKey) {
      return null
    }
    const parsed = parseGithubRepo(githubRepoKey)
    if (!parsed) {
      return null
    }
    return {
      owner: parsed.owner,
      repo: parsed.repo,
      repoKey: `${parsed.owner}/${parsed.repo}`,
      token: githubToken,
      rootPath: githubRootPath,
    }
  }

  function getGithubFolderSegments(folderId) {
    return getFolderPathSegments(folderId ?? DEFAULT_FOLDER_ID, folderMap)
  }

  async function resolveGithubUploadTarget({
    config,
    folderSegments,
    fileName,
    folderId,
    existingBooks,
  }) {
    let targetName = sanitizeFileName(fileName)
    let targetPath = buildGithubPath(config.rootPath, folderSegments, targetName)
    let existing = await fetchGithubFileMeta(config.owner, config.repo, targetPath, config.token)

    if (!existing) {
      return { fileName: targetName, path: targetPath, sha: null }
    }

    if (existing.isDirectory) {
      showToast('ชื่อไฟล์ชนกับโฟลเดอร์ใน GitHub')
      return null
    }

    const overwrite = window.confirm(`ไฟล์ “${targetName}” มีอยู่แล้วบน GitHub ต้องการเขียนทับหรือไม่?`)
    if (overwrite) {
      return { fileName: targetName, path: targetPath, sha: existing.sha }
    }

    const renamed = window.prompt('ตั้งชื่อไฟล์ใหม่ (ใส่นามสกุล .md ถ้าต้องการ)', targetName)
    if (!renamed) {
      return null
    }

    targetName = sanitizeFileName(renamed)
    const hasLocalDuplicate = existingBooks.some(
      (book) => book.folderId === folderId && normalizeToLowerCase(book.fileName) === normalizeToLowerCase(targetName),
    )

    if (hasLocalDuplicate) {
      showToast('มีไฟล์ชื่อซ้ำในโฟลเดอร์นี้')
      return null
    }

    targetPath = buildGithubPath(config.rootPath, folderSegments, targetName)
    existing = await fetchGithubFileMeta(config.owner, config.repo, targetPath, config.token)
    if (existing) {
      showToast('ชื่อไฟล์ซ้ำบน GitHub อยู่แล้ว')
      return null
    }

    return { fileName: targetName, path: targetPath, sha: null }
  }

  async function handleImportFiles(event) {
    const files = fileListToArray(event.target.files)

    if (!files.length) {
      return
    }

    setIsImporting(true)
    const targetFolderId = currentFolderId || DEFAULT_FOLDER_ID
    const githubConfig = getGithubConfig()
    const shouldUpload = Boolean(githubConfig) && githubPrefs.uploadEnabled
    const canUpload = shouldUpload && Boolean(githubConfig?.token)

    const incomingBooks = await Promise.all(
      files.map(async (file) => {
        const content = await file.text()
        const safeName = sanitizeFileName(file.name)

        return {
          id: createId('book'),
          title: stripExtension(safeName),
          fileName: safeName,
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
          normalizeToLowerCase(book.fileName) === normalizeToLowerCase(incoming.fileName),
      ),
    )

    const acceptedBooks = incomingBooks.filter(
      (incoming) => !duplicates.some((duplicate) => duplicate.id === incoming.id),
    )

    const preparedBooks = []
    const folderSegments = getGithubFolderSegments(targetFolderId)
    let skipped = 0
    let uploaded = 0
    let uploadFailed = 0
    let warnedMissingToken = false

    for (const [index, book] of acceptedBooks.entries()) {
      let nextBook = book
      const existingBooks = [...books, ...preparedBooks]

      if (shouldUpload) {
        if (!canUpload) {
          if (!warnedMissingToken) {
            showToast('ต้องใส่ GitHub token ในหน้า “ตั้งค่า GitHub” ก่อนจึงจะอัปโหลดได้')
            warnedMissingToken = true
          }
        } else {
          setStatus(`กำลังอัปโหลด ${index + 1}/${acceptedBooks.length} ไป GitHub`)

          const resolved = await resolveGithubUploadTarget({
            config: githubConfig,
            folderSegments,
            fileName: book.fileName,
            folderId: targetFolderId,
            existingBooks,
          })

          if (!resolved) {
            skipped += 1
            continue
          }

          try {
            const sha = await uploadGithubFile({
              owner: githubConfig.owner,
              repo: githubConfig.repo,
              filePath: resolved.path,
              content: book.content,
              message: `Add ${resolved.fileName} via ReadShelf`,
              token: githubConfig.token,
              sha: resolved.sha,
            })

            nextBook = {
              ...book,
              fileName: resolved.fileName,
              title: stripExtension(resolved.fileName),
              source: {
                type: 'github',
                repo: githubConfig.repoKey,
                path: resolved.path,
                sha,
              },
            }
            uploaded += 1
          } catch (error) {
            uploadFailed += 1
            showToast(`อัปโหลด ${book.fileName} ไม่สำเร็จ`)
          }
        }
      }

      preparedBooks.push(nextBook)
    }

    if (preparedBooks.length) {
      const nextBooks = [...preparedBooks, ...books]
      await putBooks(preparedBooks)
      await syncBooks(nextBooks)
      showToast(`เพิ่มหนังสือ ${preparedBooks.length} เล่มแล้ว`)
    }

    if (duplicates.length) {
      showToast(`ข้าม ${duplicates.length} ไฟล์ที่ชื่อซ้ำในโฟลเดอร์นี้`)
    }

    if (skipped) {
      showToast(`ข้ามไฟล์ ${skipped} รายการที่ยังไม่พร้อมอัปโหลด`)
    }

    if (uploaded) {
      setStatus(`อัปโหลดขึ้น GitHub แล้ว ${uploaded} ไฟล์`)
    } else if (uploadFailed) {
      setStatus('มีไฟล์บางส่วนอัปโหลดไม่สำเร็จ')
    } else {
      setStatus('นำเข้าไฟล์ใหม่เรียบร้อยแล้ว')
    }
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

  function handleNavigateUp() {
    if (!currentFolder) {
      return
    }

    setCurrentFolderId(currentFolder.parentId ?? DEFAULT_FOLDER_ID)
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

  async function handleUploadBook(bookId) {
    const book = books.find((item) => item.id === bookId)
    if (!book) return

    const config = getGithubConfig()
    if (!config || !config.token) {
      showToast('ต้องใส่ GitHub token ในไฟล์ .env ก่อนจึงจะอัปโหลดได้')
      return
    }

    setStatus(`กำลังอัปโหลด ${book.title}...`)
    
    try {
      const folderSegments = getGithubFolderSegments(book.folderId)
      const targetName = sanitizeFileName(book.fileName)
      const targetPath = buildGithubPath(config.rootPath, folderSegments, targetName)
      
      const existing = await fetchGithubFileMeta(config.owner, config.repo, targetPath, config.token)
      if (existing?.isDirectory) {
        showToast('ชื่อไฟล์ชนกับโฟลเดอร์ใน GitHub')
        return
      }

      const sha = await uploadGithubFile({
        owner: config.owner,
        repo: config.repo,
        filePath: targetPath,
        content: book.content,
        message: `Upload ${targetName} via ReadShelf`,
        token: config.token,
        sha: existing?.sha ?? null,
      })

      const updatedBook = {
        ...book,
        source: {
          type: 'github',
          repo: config.repoKey,
          path: targetPath,
          sha,
        },
      }
      
      await updateBook(book.id, updatedBook)
      setBookActionId(null)
      showToast(`อัปโหลด ${book.title} สำเร็จ`)
      setStatus('อัปโหลดไฟล์เสร็จสิ้น')
    } catch (error) {
      showToast(`อัปโหลดไม่สำเร็จ: ${String(error.message ?? error)}`)
      setStatus('อัปโหลดไม่สำเร็จ')
    }
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
    const exportedAt = Date.now()
    const nextPrefs = {
      ...prefs,
      lastBackupAt: exportedAt,
      lastBackupReminderDismissedAt: exportedAt,
    }
    const payload = createBackupPayload(folders, books, nextPrefs, exportedAt)

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = buildBackupFileName('json', new Date(exportedAt))
    anchor.click()
    URL.revokeObjectURL(url)
    setPrefs(nextPrefs)
    await putPrefs(nextPrefs)
    showToast('ส่งออกแบ็กอัปแล้ว')
    setStatus('สำรองข้อมูลของเครื่องนี้เรียบร้อยแล้ว')
  }

  async function handleShareBackup() {
    const exportedAt = Date.now()
    const nextPrefs = {
      ...prefs,
      lastBackupAt: exportedAt,
      lastBackupReminderDismissedAt: exportedAt,
    }
    const payload = createBackupPayload(folders, books, nextPrefs, exportedAt)
    const payloadText = JSON.stringify(payload, null, 2)
    const shareFile = new File([payloadText], buildBackupFileName('txt', new Date(exportedAt)), {
      type: 'text/plain',
    })

    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare({ files: [shareFile] }))
      ) {
        await navigator.share({
          title: 'ReadShelf Backup',
          text: 'สำรองคลังหนังสือ ReadShelf Personal',
          files: [shareFile],
        })

        setPrefs(nextPrefs)
        await putPrefs(nextPrefs)
        showToast('เปิดหน้าต่างแชร์แบ็กอัปแล้ว')
        setStatus('ส่งไฟล์แบ็กอัปไป Files หรือ Google Drive ได้จากหน้าต่างแชร์นี้')
        return
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        showToast('ยกเลิกการแชร์แบ็กอัป')
        return
      }
    }

    await handleExportBackup()
    showToast('เครื่องนี้ไม่รองรับการแชร์ไฟล์โดยตรง จึงดาวน์โหลดแบ็กอัปให้แทน')
  }

  async function handleDismissBackupReminder() {
    const nextPrefs = {
      ...prefs,
      lastBackupReminderDismissedAt: Date.now(),
    }

    setPrefs(nextPrefs)
    await putPrefs(nextPrefs)
    showToast('ปิดการเตือนวันนี้แล้ว')
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
        prefs: normalizePrefs(payload.prefs ?? {}),
      })

      await syncFolders(payload.folders)
      await syncBooks(payload.books)
      setPrefs(normalizePrefs(payload.prefs ?? {}))
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


  async function handleGithubImport() {
    if (!ghSelected.size) return
    const parsed = parseGithubRepo(ghRepo)
    if (!parsed) return
    setGhStatus('importing')
    setGhError('')
    try {
      const selectedPaths = [...ghSelected]
      const fileMap = new Map(ghFiles.map((file) => [file.path, file]))
      const incomingBooks = await Promise.all(
        selectedPaths.map(async (filePath) => {
          const { content, sha } = await fetchGithubFileContent(
            parsed.owner,
            parsed.repo,
            filePath,
            ghToken.trim(),
          )
          const fileName = sanitizeFileName(filePath.split('/').pop() || filePath)
          return {
            id: createId('book'),
            title: stripExtension(fileName),
            fileName,
            folderId: currentFolderId || DEFAULT_FOLDER_ID,
            content,
            excerpt: extractLead(content),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastOpenedAt: null,
            lastReadAt: null,
            progress: 0,
            readerFontSize: prefs.fontSize,
            bookmarks: [],
            source: {
              type: 'github',
              repo: `${parsed.owner}/${parsed.repo}`,
              path: filePath,
              sha: sha ?? fileMap.get(filePath)?.sha ?? null,
            },
          }
        }),
      )

      const duplicates = incomingBooks.filter((incoming) =>
        books.some(
          (book) =>
            book.folderId === incoming.folderId &&
            normalizeToLowerCase(book.fileName) === normalizeToLowerCase(incoming.fileName),
        ),
      )
      const acceptedBooks = incomingBooks.filter(
        (incoming) => !duplicates.some((dup) => dup.id === incoming.id),
      )

      if (acceptedBooks.length) {
        await putBooks(acceptedBooks)
        await syncBooks([...acceptedBooks, ...books])
      }
      if (duplicates.length) showToast(`ข้าม ${duplicates.length} ไฟล์ที่ชื่อซ้ำ`)
      if (acceptedBooks.length) {
        showToast(`นำเข้าจาก GitHub ${acceptedBooks.length} เล่มแล้ว`)
        setStatus(`นำเข้าจาก GitHub ${acceptedBooks.length} เล่มแล้ว`)
      }
      setGhStatus('idle')
      closeGhModal()
    } catch (error) {
      setGhStatus('error')
      setGhError(String(error.message ?? error))
    }
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
      <header className="app-header simple-header">
        <div className="header-main">
          <p className="eyebrow">ReadShelf Personal</p>
          <h1>ชั้นหนังสือส่วนตัว</h1>
          <div className="header-breadcrumb">
            {breadcrumb.map((folder, index) => (
              <span key={folder.id}>
                {folder.name}
                {index < breadcrumb.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="header-actions compact-actions">
          <button type="button" className="primary-button" onClick={() => setHelpOpen(true)}>
            คู่มือ
          </button>
        </div>
      </header>

      <section className="summary-pills">
        <article className="summary-pill">
          <strong>{stats.totalBooks}</strong>
          <span>หนังสือ</span>
        </article>
        <article className="summary-pill">
          <strong>{stats.totalFolders}</strong>
          <span>โฟลเดอร์</span>
        </article>
        <article className="summary-pill">
          <strong>{stats.readingBooks}</strong>
          <span>กำลังอ่าน</span>
        </article>
        <article className="summary-pill">
          <strong>{stats.totalBooks ? `${stats.avgProgress}%` : '—'}</strong>
          <span>เฉลี่ย</span>
        </article>
      </section>

      {needsBackupReminder ? (
        <section className="backup-reminder compact-reminder" aria-live="polite">
          <div className="backup-reminder-copy">
            <h3>วันนี้ยังไม่ได้สำรองข้อมูล</h3>
            <p>กดแบ็กอัปเพื่อส่งเข้า Files หรือ Google Drive ได้เลย</p>
          </div>
          <div className="backup-reminder-actions">
            <button type="button" className="ghost-button" onClick={handleDismissBackupReminder}>
              พรุ่งนี้
            </button>
            <button type="button" className="primary-button" onClick={handleShareBackup}>
              สำรองตอนนี้
            </button>
          </div>
        </section>
      ) : null}

      <main className="library-stack">
        <section className="library-panel">
          <div className="panel-header panel-header-spread">
            <div>
              <p className="eyebrow">Current Shelf</p>
              <h2>{currentFolder?.name ?? 'กำลังโหลดโฟลเดอร์'}</h2>
              <div className="library-status-line">{status}</div>
              <div className="library-status-sub">{githubSummary}</div>
            </div>

            <div className="folder-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleNavigateUp}
                disabled={!currentFolder || !currentFolder.parentId}
              >
                ขึ้นหนึ่งระดับ
              </button>
              <select
                value={prefs.sortBy}
                onChange={(event) => syncPrefs({ ...prefs, sortBy: event.target.value })}
              >
                <option value="recent">ล่าสุด</option>
                <option value="title">ตามชื่อ</option>
                <option value="progress">ตามความคืบหน้า</option>
              </select>
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

          {latestReadingBook ? (
            <section className="recent-section">
              <div className="section-heading">
                <p className="eyebrow">Continue</p>
                <h3>กลับไปเล่มล่าสุด</h3>
              </div>
              <button
                type="button"
                className="continue-strip"
                onClick={() => handleOpenBook(latestReadingBook.id)}
              >
                <div>
                  <strong>{latestReadingBook.title}</strong>
                  <p>{trimText(latestReadingBook.excerpt, 120)}</p>
                </div>
                <span>{latestReadingBook.progress ?? 0}%</span>
              </button>
            </section>
          ) : null}

          <section className="subfolder-section">
            <div className="section-heading">
              <p className="eyebrow">Folder Shelf</p>
              <h3>โฟลเดอร์บนชั้นนี้</h3>
            </div>
            {childFolders.length ? (
              <div className="folder-bookshelf">
                <div className="folder-book-row">
                  {childFolders.map((folder, index) => (
                    <button
                      key={folder.id}
                      type="button"
                      className={`folder-book folder-tone-${index % 4}`}
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <span className="folder-book-spine">{folder.name}</span>
                      <div className="folder-book-front">
                        <strong>{folder.name}</strong>
                        <small>{books.filter((book) => book.folderId === folder.id).length} เล่ม</small>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="shelf-plank-block" />
              </div>
            ) : (
              <div className="placeholder-card">ยังไม่มีโฟลเดอร์ย่อยในชั้นนี้</div>
            )}
          </section>

          <section className="book-section">
            <div className="section-heading">
              <p className="eyebrow">Books</p>
              <h3>ไฟล์ในโฟลเดอร์นี้</h3>
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
                        <button type="button" onClick={() => handleUploadBook(book.id)}>
                          อัปโหลดขึ้นเว็บ
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

          <section className="library-bottom-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'กำลังนำเข้า...' : 'เพิ่มหนังสือ'}
            </button>
            <button type="button" className="ghost-button" onClick={() => openFolderEditor('create')}>
              {currentFolder?.parentId ? 'เพิ่มโฟลเดอร์ย่อย' : 'เพิ่มโฟลเดอร์'}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => handleGithubSync()}
              disabled={ghSyncing}
            >
              {ghSyncing ? 'กำลังซิงก์...' : 'ซิงก์ GitHub'}
            </button>
            <button type="button" className="ghost-button" onClick={handleShareBackup}>
              แบ็กอัป
            </button>
            <button type="button" className="ghost-button" onClick={() => backupInputRef.current?.click()}>
              กู้คืน
            </button>
          </section>
        </section>
      </main>

      {helpOpen ? (
        <div className="modal-overlay" onClick={() => setHelpOpen(false)}>
          <div className="modal-card help-card" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">Quick Guide</p>
            <h3>วิธีใช้แบบสั้นที่สุด</h3>
            <div className="help-list">
              <article>
                <strong>เพิ่มโฟลเดอร์</strong>
                <p>กด “เพิ่มโฟลเดอร์” แล้วกดเข้าไปในชั้นนั้นเพื่อดูโฟลเดอร์ย่อยหรือไฟล์</p>
              </article>
              <article>
                <strong>เพิ่มไฟล์อ่าน</strong>
                <p>กด “เพิ่มหนังสือ” แล้วเลือกไฟล์ .md จากเครื่องของคุณ (ถ้าเปิด GitHub Cloud ระบบจะอัปโหลดทันที)</p>
              </article>
              <article>
                <strong>สำรองข้อมูล</strong>
                <p>กด “แบ็กอัป” เพื่อแชร์ไป Files หรือ Google Drive หรือใช้ไฟล์แบ็กอัปไว้กู้คืน</p>
              </article>
              <article>
                <strong>กู้คืนข้อมูล</strong>
                <p>กด “กู้คืน” แล้วเลือกไฟล์แบ็กอัปเก่าเพื่อเอาคลังหนังสือกลับมา</p>
              </article>
              <article>
                <strong>GitHub Cloud</strong>
                <p>ถ้า repo เป็น public ให้ใส่ค่าใน readshelf.config.json แล้วเลือกโหมดซิงก์อัตโนมัติ เพื่อให้ดึงไฟล์เมื่อเปิดแอปหรือกลับมาใช้งาน (โหมดกดซิงก์เองใช้ปุ่ม “ซิงก์ GitHub”)</p>
              </article>
              <article>
                <strong>โหมดจัดเก็บ</strong>
                <p>{storageSummary.detail}</p>
                <small>สถานะล่าสุด: {backupStatus}</small>
              </article>
            </div>
            <div className="modal-actions">
              <button type="button" className="primary-button" onClick={() => setHelpOpen(false)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
