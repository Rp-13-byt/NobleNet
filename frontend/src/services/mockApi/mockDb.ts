export const getDb = <T>(key: string, initialData: T): T => {
  const data = localStorage.getItem(`noblenet_${key}`)
  if (!data) {
    localStorage.setItem(`noblenet_${key}`, JSON.stringify(initialData))
    return initialData
  }
  return JSON.parse(data) as T
}

export const setDb = <T>(key: string, data: T): void => {
  localStorage.setItem(`noblenet_${key}`, JSON.stringify(data))
}

// Helper to simulate network delay
export const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))
