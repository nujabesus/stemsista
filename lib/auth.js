import { supabase } from './supabase'
import Cookies from 'js-cookie'

export async function signup(username, password) {
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()
  
  if (existing) return { error: 'Username already taken' }

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password }])
    .select()
    .single()

  if (error) return { error: error.message }
  
  Cookies.set('stemsista_user', username, { expires: 7 })
  return { user: data }
}

export async function login(username, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !data) return { error: 'Invalid username or password' }
  
  Cookies.set('stemsista_user', username, { expires: 7 })
  return { user: data }
}

export function logout() {
  Cookies.remove('stemsista_user')
}

export function getCurrentUser() {
  return Cookies.get('stemsista_user') || null
}