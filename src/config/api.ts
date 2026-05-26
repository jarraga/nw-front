const rawApiUrl = import.meta.env.VITE_API_URL

if (!rawApiUrl) {
  throw new Error('VITE_API_URL is required.')
}

export const API_URL = rawApiUrl.replace(/\/$/, '')

export const CUSTOMERS_URL = `${API_URL}/customers`

export function buildWebSocketUrl(path: string) {
  const url = new URL(path, API_URL)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return url.toString()
}
