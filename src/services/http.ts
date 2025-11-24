import axios from 'axios'
import { useUserStore } from '@/store/user'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
