export type StudioProject = {
  id: string
  name: string
  tool: 'stamp' | 'letterhead'
  updatedAt: string
  payload: unknown
}

const databaseName = 'digitalivez-design-studios'
const databaseVersion = 1

function openStudioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Browser storage is unavailable.'))
      return
    }
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('projects')) database.createObjectStore('projects', { keyPath: 'id' })
      if (!database.objectStoreNames.contains('brands')) database.createObjectStore('brands', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open browser storage.'))
  })
}

export async function saveProject(project: StudioProject): Promise<void> {
  const database = await openStudioDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('projects', 'readwrite')
    transaction.objectStore('projects').put(project)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this project.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Project save was cancelled.'))
  })
  database.close()
}

export async function listProjects(tool?: StudioProject['tool']): Promise<StudioProject[]> {
  const database = await openStudioDatabase()
  const results = await new Promise<StudioProject[]>((resolve, reject) => {
    const request = database.transaction('projects', 'readonly').objectStore('projects').getAll()
    request.onsuccess = () => resolve(request.result as StudioProject[])
    request.onerror = () => reject(request.error ?? new Error('Could not read saved projects.'))
  })
  database.close()
  return results.filter(project => !tool || project.tool === tool).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function removeProject(id: string): Promise<void> {
  const database = await openStudioDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('projects', 'readwrite')
    transaction.objectStore('projects').delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete this project.'))
  })
  database.close()
}

export async function saveBrand<T extends { id: string; name: string; updatedAt: string }>(brand: T): Promise<void> {
  const database = await openStudioDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('brands', 'readwrite')
    transaction.objectStore('brands').put(brand)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this brand profile.'))
  })
  database.close()
}

export async function listBrands<T>(): Promise<T[]> {
  const database = await openStudioDatabase()
  const brands = await new Promise<T[]>((resolve, reject) => {
    const request = database.transaction('brands', 'readonly').objectStore('brands').getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error ?? new Error('Could not read brand profiles.'))
  })
  database.close()
  return brands
}
