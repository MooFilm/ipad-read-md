const DB_NAME = 'readshelf-personal-db'
const DB_VERSION = 1
const META_STORE = 'meta'
const FOLDER_STORE = 'folders'
const BOOK_STORE = 'books'
const FALLBACK_KEY = 'readshelf-personal-fallback'

const defaultPrefs = {
  sortBy: 'recent',
  fontSize: 18,
}

let dbPromise = null

function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function openDatabase() {
  if (!supportsIndexedDb()) {
    return Promise.resolve(null)
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains(FOLDER_STORE)) {
          const folderStore = db.createObjectStore(FOLDER_STORE, { keyPath: 'id' })
          folderStore.createIndex('by_parent', 'parentId', { unique: false })
        }

        if (!db.objectStoreNames.contains(BOOK_STORE)) {
          const bookStore = db.createObjectStore(BOOK_STORE, { keyPath: 'id' })
          bookStore.createIndex('by_folder', 'folderId', { unique: false })
          bookStore.createIndex('by_last_opened', 'lastOpenedAt', { unique: false })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return dbPromise
}

function readFallbackSnapshot() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(FALLBACK_KEY) ?? '{}')

    return {
      folders: Array.isArray(snapshot.folders) ? snapshot.folders : [],
      books: Array.isArray(snapshot.books) ? snapshot.books : [],
      prefs: { ...defaultPrefs, ...(snapshot.prefs ?? {}) },
      storageMode: 'localStorage',
    }
  } catch {
    return {
      folders: [],
      books: [],
      prefs: { ...defaultPrefs },
      storageMode: 'localStorage',
    }
  }
}

function writeFallbackSnapshot(snapshot) {
  localStorage.setItem(
    FALLBACK_KEY,
    JSON.stringify({
      folders: snapshot.folders ?? [],
      books: snapshot.books ?? [],
      prefs: snapshot.prefs ?? defaultPrefs,
    }),
  )
}

async function runWithFallback(indexedDbWork, fallbackWork) {
  const db = await openDatabase()

  if (!db) {
    return fallbackWork()
  }

  try {
    return await indexedDbWork(db)
  } catch {
    return fallbackWork()
  }
}

export async function getLibrarySnapshot() {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction([FOLDER_STORE, BOOK_STORE, META_STORE], 'readonly')
      const foldersStore = transaction.objectStore(FOLDER_STORE)
      const booksStore = transaction.objectStore(BOOK_STORE)
      const metaStore = transaction.objectStore(META_STORE)

      const [folders, books, prefsRecord] = await Promise.all([
        requestToPromise(foldersStore.getAll()),
        requestToPromise(booksStore.getAll()),
        requestToPromise(metaStore.get('prefs')),
      ])

      await transactionDone(transaction)

      return {
        folders,
        books,
        prefs: { ...defaultPrefs, ...(prefsRecord?.value ?? {}) },
        storageMode: 'indexedDB',
      }
    },
    async () => readFallbackSnapshot(),
  )
}

export async function putFolder(folder) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(FOLDER_STORE, 'readwrite')
      transaction.objectStore(FOLDER_STORE).put(folder)
      await transactionDone(transaction)
      return folder
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      const folders = [...snapshot.folders.filter((item) => item.id !== folder.id), folder]
      writeFallbackSnapshot({ ...snapshot, folders })
      return folder
    },
  )
}

export async function deleteFolder(folderId) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(FOLDER_STORE, 'readwrite')
      transaction.objectStore(FOLDER_STORE).delete(folderId)
      await transactionDone(transaction)
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      const folders = snapshot.folders.filter((item) => item.id !== folderId)
      writeFallbackSnapshot({ ...snapshot, folders })
    },
  )
}

export async function putBook(book) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(BOOK_STORE, 'readwrite')
      transaction.objectStore(BOOK_STORE).put(book)
      await transactionDone(transaction)
      return book
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      const books = [...snapshot.books.filter((item) => item.id !== book.id), book]
      writeFallbackSnapshot({ ...snapshot, books })
      return book
    },
  )
}

export async function putBooks(books) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(BOOK_STORE, 'readwrite')
      const store = transaction.objectStore(BOOK_STORE)

      books.forEach((book) => store.put(book))

      await transactionDone(transaction)
      return books
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      const incomingIds = new Set(books.map((book) => book.id))
      const nextBooks = [...snapshot.books.filter((book) => !incomingIds.has(book.id)), ...books]
      writeFallbackSnapshot({ ...snapshot, books: nextBooks })
      return books
    },
  )
}

export async function deleteBook(bookId) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(BOOK_STORE, 'readwrite')
      transaction.objectStore(BOOK_STORE).delete(bookId)
      await transactionDone(transaction)
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      const books = snapshot.books.filter((item) => item.id !== bookId)
      writeFallbackSnapshot({ ...snapshot, books })
    },
  )
}

export async function putPrefs(prefs) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction(META_STORE, 'readwrite')
      transaction.objectStore(META_STORE).put({ key: 'prefs', value: prefs })
      await transactionDone(transaction)
      return prefs
    },
    async () => {
      const snapshot = readFallbackSnapshot()
      writeFallbackSnapshot({ ...snapshot, prefs })
      return prefs
    },
  )
}

export async function replaceLibrary(snapshot) {
  return runWithFallback(
    async (db) => {
      const transaction = db.transaction([FOLDER_STORE, BOOK_STORE, META_STORE], 'readwrite')
      const foldersStore = transaction.objectStore(FOLDER_STORE)
      const booksStore = transaction.objectStore(BOOK_STORE)
      const metaStore = transaction.objectStore(META_STORE)

      foldersStore.clear()
      booksStore.clear()
      metaStore.put({ key: 'prefs', value: snapshot.prefs ?? defaultPrefs })

      ;(snapshot.folders ?? []).forEach((folder) => foldersStore.put(folder))
      ;(snapshot.books ?? []).forEach((book) => booksStore.put(book))

      await transactionDone(transaction)
      return true
    },
    async () => {
      writeFallbackSnapshot({
        folders: snapshot.folders ?? [],
        books: snapshot.books ?? [],
        prefs: snapshot.prefs ?? defaultPrefs,
      })
      return true
    },
  )
}

export { defaultPrefs }
