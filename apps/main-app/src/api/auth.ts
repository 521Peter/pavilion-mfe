import { api } from './http'

export interface LoginResult {
  accessToken: string
}

export interface UserProfile {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  roles: string[]
  status: string
  createdAt: string
}

export function login(username: string, password: string) {
  return api.post<LoginResult>('/auth/login', { username, password })
}

export function register(username: string, password: string, nickname?: string) {
  return api.post<LoginResult>('/auth/register', {
    username,
    password,
    nickname,
  })
}

export function getProfile() {
  return api.get<UserProfile>('/auth/profile')
}
