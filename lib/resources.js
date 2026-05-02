import { supabase } from './supabase'

// Get all resources
export async function getResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('upvotes', { ascending: false })
  return data
}

// Add a new resource
export async function addResource(resource) {
  const { data, error } = await supabase
    .from('resources')
    .insert([resource])
  return data
}

// Upvote a resource
export async function upvoteResource(id, currentUpvotes) {
  const { data, error } = await supabase
    .from('resources')
    .update({ upvotes: currentUpvotes + 1 })
    .eq('id', id)
  return data
}

// Search and filter
export async function searchResources(keyword, category, mediaType) {
  let query = supabase.from('resources').select('*')
  
  if (category) query = query.eq('category', category)
  if (mediaType) query = query.eq('media_type', mediaType)
  if (keyword) query = query.ilike('description', `%${keyword}%`)
  
  const { data } = await query.order('upvotes', { ascending: false })
  return data
}