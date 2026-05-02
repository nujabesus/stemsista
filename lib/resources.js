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
    .from("resources")
    .insert([resource])
    .select();

  if (error) console.error(error);
  return data;
}

// Upvote a resource
export async function upvoteResource(id, currentUpvotes) {
  const { data, error } = await supabase
    .from("resources")
    .update({ upvotes: currentUpvotes + 1 })
    .eq("id", id)
    .select();

  if (error) console.error(error);
  return data;
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

// Save a resource
export async function saveResource(username, resourceId) {
  const { data } = await supabase
    .from('saved_resources')
    .insert([{ username, resource_id: resourceId }])
  return data
}

// Check if already saved
export async function isResourceSaved(username, resourceId) {
  const { data } = await supabase
    .from('saved_resources')
    .select('*')
    .eq('username', username)
    .eq('resource_id', resourceId)
    .single()
  return !!data
}

// Get saved resources for a user
export async function getSavedResources(username) {
  const { data } = await supabase
    .from('saved_resources')
    .select('resource_id')
    .eq('username', username)
    .order('created_at', { ascending: false })
  return data
}

// Log a view
export async function logView(username, resourceId) {
  await supabase
    .from('views')
    .insert([{ username, resource_id: resourceId }])
}

// Get recently viewed resource IDs for a user
export async function getRecentlyViewed(username) {
  const { data } = await supabase
    .from('views')
    .select('resource_id')
    .eq('username', username)
    .order('viewed_at', { ascending: false })
    .limit(9)
  return data
}

// Unsave a resource
export async function unsaveResource(username, resourceId) {
  await supabase
    .from('saved_resources')
    .delete()
    .eq('username', username)
    .eq('resource_id', resourceId)
}

// Get comments for a resource
export async function getComments(resourceId) {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: true })
  return data
}

// Add a comment
export async function addComment(resourceId, username, comment) {
  const { data } = await supabase
    .from('comments')
    .insert([{ resource_id: resourceId, username, comment }])
  return data
}