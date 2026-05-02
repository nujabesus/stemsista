'use client'

import { useState, useEffect } from 'react'
import { getResources, addResource, upvoteResource, searchResources, saveResource, unsaveResource, getSavedResources, logView, getComments, addComment, followUser, unfollowUser, isFollowing, getFeedResources, getReplies, addReply } from '../lib/resources'
import { useRouter } from 'next/navigation'
import { getCurrentUser, login, signup } from '../lib/auth'

const MEDIA_TYPES = ['Video', 'Book', 'Podcast', 'Blog', 'Talk', 'Movie']

function getYoutubeThumbnail(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  return null
}

type Resource = {
  id: number
  title: string
  url: string
  media_type: string
  description: string
  tags: string
  thumbnail_url: string
  upvotes: number
  submitted_by: string
  created_at: string
}

type Comment = {
  id: number
  resource_id: number
  username: string
  comment: string
  created_at: string
}

type Reply = {
  id: number
  comment_id: number
  username: string
  reply: string
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [featured, setFeatured] = useState<Resource | null>(null)
  const [selected, setSelected] = useState<Resource | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [authForm, setAuthForm] = useState({ username: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [showFeed, setShowFeed] = useState(false)
  const [feedResources, setFeedResources] = useState<Resource[]>([])
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({})
  const [replyText, setReplyText] = useState<Record<number, string>>({})
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({})

  const [form, setForm] = useState({
    title: '', url: '', media_type: 'Video',
    description: '', tags: '', thumbnail_url: '', submitted_by: ''
  })

  useEffect(() => {
    loadResources()
    const user = getCurrentUser()
    setCurrentUser(user)
    if (user) loadSavedIds(user)
  }, [])

  async function loadResources() {
    setLoading(true)
    const data = await getResources()
    if (data && data.length > 0) {
      setResources(data)
      setFeatured(data[Math.floor(Math.random() * data.length)])
    }
    setLoading(false)
  }

  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    if (e.target.value.trim() === '') {
      loadResources()
    } else {
      const data = await searchResources(e.target.value, '', '')
      setResources(data || [])
    }
  }

  async function handleAdd() {
    if (!form.title || !form.url) return
    const thumbnail = form.thumbnail_url || getYoutubeThumbnail(form.url) || ''
    await addResource({ ...form, thumbnail_url: thumbnail, upvotes: 0 })
    setShowAdd(false)
    setForm({ title: '', url: '', media_type: 'Video', description: '', tags: '', thumbnail_url: '', submitted_by: '' })
    loadResources()
  }

  async function handleUpvote(resource: Resource) {
    await upvoteResource(resource.id, resource.upvotes)
    loadResources()
  }

  function randomize() {
    if (resources.length > 0) {
      setFeatured(resources[Math.floor(Math.random() * resources.length)])
    }
  }

  async function handleSave(resource: Resource) {
    if (!currentUser) { setShowAuth(true); return }
    const already = savedIds.includes(resource.id)
    if (already) {
      await unsaveResource(currentUser, resource.id)
      setSavedIds(savedIds.filter(id => id !== resource.id))
    } else {
      await saveResource(currentUser, resource.id)
      setSavedIds([...savedIds, resource.id])
    }
  }

  async function handleOpenResource(resource: Resource) {
    setSelected(resource)
    setComments([])
    setRepliesMap({})
    setShowReplies({})
    if (currentUser) await logView(currentUser, resource.id)
    const data = await getComments(resource.id)
    setComments(data || [])
  }

  async function loadSavedIds(user: string) {
    const data = await getSavedResources(user)
    if (data) setSavedIds(data.map((d: any) => d.resource_id))
  }

  async function handleAddComment() {
    if (!commentText.trim()) return
    if (!currentUser) { setShowAuth(true); return }
    await addComment(selected!.id, currentUser, commentText)
    setCommentText('')
    const data = await getComments(selected!.id)
    setComments(data || [])
  }

  async function handleShowFeed() {
    if (!currentUser) { setShowAuth(true); return }
    setShowFeed(true)
    const data = await getFeedResources(currentUser)
    setFeedResources(data || [])
  }

  async function handleFollowToggle(username: string) {
    if (!currentUser || username === currentUser) return
    const already = followingMap[username]
    if (already) {
      await unfollowUser(currentUser, username)
      setFollowingMap({...followingMap, [username]: false})
    } else {
      await followUser(currentUser, username)
      setFollowingMap({...followingMap, [username]: true})
    }
  }

  async function checkFollowing(username: string) {
    if (!currentUser || username === currentUser) return
    const result = await isFollowing(currentUser, username)
    setFollowingMap(prev => ({...prev, [username]: result}))
  }

  async function handleLoadReplies(commentId: number) {
    const showing = showReplies[commentId]
    setShowReplies(prev => ({...prev, [commentId]: !showing}))
    if (!showing && !repliesMap[commentId]) {
      const data = await getReplies(commentId)
      setRepliesMap(prev => ({...prev, [commentId]: data || []}))
    }
  }

  async function handleAddReply(commentId: number) {
    const text = replyText[commentId]
    if (!text?.trim()) return
    if (!currentUser) { setShowAuth(true); return }
    await addReply(commentId, currentUser, text)
    setReplyText(prev => ({...prev, [commentId]: ''}))
    const data = await getReplies(commentId)
    setRepliesMap(prev => ({...prev, [commentId]: data || []}))
    setShowReplies(prev => ({...prev, [commentId]: true}))
  }

  const allTags = resources.flatMap(r => r.tags ? r.tags.split(',').map(t => t.trim()) : [])
  const tagCounts = allTags.reduce((acc: Record<string, number>, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})
  const sortedTags = Object.entries(tagCounts).sort((a, b) => a[0].localeCompare(b[0]))
  const getThumbnail = (r: Resource) => r.thumbnail_url || getYoutubeThumbnail(r.url) || null

  return (
    <div className="min-h-screen bg-amber-50 font-sans">

      {/* NAV */}
      <div className="flex justify-center pt-4 pb-2">
        <img src="/logo.png" alt="Curie's Catalogue" className="h-25"/>
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (currentUser) { router.push('/profile') } else { setShowAuth(true) } }}
            className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white hover:bg-violet-600 transition"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </button>
          <button onClick={handleShowFeed} className="bg-violet-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-violet-600 transition">
            Friend Activity
          </button>
          <button onClick={() => setShowTags(!showTags)} className="text-sm font-semibold underline text-gray-700 ml-2">
            Explore Tags
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border-2 border-gray-800 rounded-full px-4 py-2 bg-amber-50 w-72">
            <input
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder="Search resources..."
              value={search}
              onChange={handleSearch}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gray-500">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center text-2xl font-light shadow">+</button>
        </div>
      </div>

      <div className="px-6 pb-10">

        {/* EXPLORE TAGS */}
        {showTags && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Explore Tags A–Z</h2>
            <div className="flex flex-wrap gap-2">
              {sortedTags.length === 0 && <p className="text-gray-400 text-sm">No tags yet — add some resources!</p>}
              {sortedTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => { setSearch(tag); setShowTags(false); searchResources(tag, '', '').then(d => setResources(d || [])) }}
                  className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-violet-200 transition"
                >
                  {tag} <span className="text-violet-400">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE OF THE DAY */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold">Feature of the Day</h2>
          <button onClick={randomize} className="bg-violet-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition">
            Randomize
          </button>
        </div>

        {featured ? (
          <div onClick={() => handleOpenResource(featured)} className="w-full h-64 rounded-2xl overflow-hidden mb-6 cursor-pointer relative group">
            {getThumbnail(featured) ? (
              <img src={getThumbnail(featured)!} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            ) : (
              <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                <span className="text-violet-300 text-6xl">◈</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white font-bold text-lg">{featured.title}</p>
              <p className="text-white/70 text-sm">{featured.media_type}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-64 rounded-2xl bg-gray-200 mb-6 flex items-center justify-center">
            <p className="text-gray-400">{loading ? 'Loading...' : 'No resources yet — add one!'}</p>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-3 gap-4">
          {resources.map(r => (
            <div key={r.id} onClick={() => handleOpenResource(r)} className="cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition group">
              <div className="h-44 bg-gray-100 overflow-hidden">
                {getThumbnail(r) ? (
                  <img src={getThumbnail(r)!} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">◈</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{r.title}</p>
                <p className="text-xs text-gray-400">{r.media_type}</p>
                <button onClick={e => { e.stopPropagation(); handleUpvote(r) }} className="mt-2 text-xs text-violet-500 font-semibold hover:text-violet-700">
                  👍 {r.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RESOURCE MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-amber-50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start p-6 pb-0">
              <h2 className="font-bold text-xl pr-4">{selected.title}</h2>
              <button onClick={() => { setSelected(null); setComments([]); setCommentText('') }} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {getThumbnail(selected) && (
              <div className="mx-6 mt-4 rounded-xl overflow-hidden h-56">
                <img src={getThumbnail(selected)!} alt={selected.title} className="w-full h-full object-cover"/>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Shared by{' '}
                  <button onClick={() => handleFollowToggle(selected.submitted_by)} onMouseEnter={() => checkFollowing(selected.submitted_by)} className="font-semibold hover:text-violet-500 transition">
                    {selected.submitted_by || 'anonymous'}
                  </button>
                  {selected.submitted_by && currentUser && selected.submitted_by !== currentUser && (
                    <button
                      onClick={() => handleFollowToggle(selected.submitted_by)}
                      onMouseEnter={() => checkFollowing(selected.submitted_by)}
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full border transition ${followingMap[selected.submitted_by] ? 'bg-violet-500 text-white border-violet-500' : 'border-violet-300 text-violet-500 hover:bg-violet-50'}`}
                    >
                      {followingMap[selected.submitted_by] ? 'Following' : '+ Follow'}
                    </button>
                  )}
                </p>
                <p className="text-sm text-gray-400">{new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              {selected.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.tags.split(',').map(t => (
                    <span key={t} className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-medium">{t.trim()}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-700 mb-4">{selected.description}</p>
              <div className="flex gap-3 flex-wrap mb-6">
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="bg-violet-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition">
                  Open Resource
                </a>
                <button onClick={() => handleUpvote(selected)} className="border border-violet-300 text-violet-500 px-5 py-2 rounded-full text-sm font-semibold hover:bg-violet-50 transition">
                  👍 {selected.upvotes}
                </button>
                <button
                  onClick={() => handleSave(selected)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition border ${savedIds.includes(selected.id) ? 'bg-violet-500 text-white border-violet-500' : 'border-violet-300 text-violet-500 hover:bg-violet-50'}`}
                >
                  {savedIds.includes(selected.id) ? '🔖 Saved' : '🔖 Save'}
                </button>
              </div>

              {/* DISCUSSION */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-base mb-4">Discussion</h3>
                <div className="flex gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-violet-400 bg-white"
                      placeholder={currentUser ? "Add a comment..." : "Log in to comment"}
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                      disabled={!currentUser}
                    />
                    <button onClick={handleAddComment} disabled={!currentUser} className="bg-violet-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition disabled:opacity-40">
                      Post
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {comments.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No comments yet — be the first!</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-600 flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => handleFollowToggle(c.username)} onMouseEnter={() => checkFollowing(c.username)} className="font-semibold text-sm hover:text-violet-500 transition">
                            {c.username}
                          </button>
                          {currentUser && c.username !== currentUser && (
                            <button
                              onClick={() => handleFollowToggle(c.username)}
                              onMouseEnter={() => checkFollowing(c.username)}
                              className={`text-xs px-2 py-0.5 rounded-full border transition ${followingMap[c.username] ? 'bg-violet-500 text-white border-violet-500' : 'border-violet-300 text-violet-500 hover:bg-violet-50'}`}
                            >
                              {followingMap[c.username] ? 'Following' : '+ Follow'}
                            </button>
                          )}
                          <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{c.comment}</p>

                        {/* REPLY BUTTON */}
                        <button
                          onClick={() => handleLoadReplies(c.id)}
                          className="text-xs text-violet-400 hover:text-violet-600 font-medium"
                        >
                          {showReplies[c.id] ? 'Hide replies' : `Reply${repliesMap[c.id]?.length ? ` (${repliesMap[c.id].length})` : ''}`}
                        </button>

                        {/* REPLIES */}
                        {showReplies[c.id] && (
                          <div className="mt-3 ml-4 border-l-2 border-violet-100 pl-4 flex flex-col gap-3">
                            {(repliesMap[c.id] || []).map(r => (
                              <div key={r.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-500 flex-shrink-0">
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-xs">{r.username}</span>
                                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-gray-700">{r.reply}</p>
                                </div>
                              </div>
                            ))}

                            {/* REPLY INPUT */}
                            {currentUser && (
                              <div className="flex gap-2 mt-1">
                                <input
                                  className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-xs outline-none focus:border-violet-400 bg-white"
                                  placeholder="Write a reply..."
                                  value={replyText[c.id] || ''}
                                  onChange={e => setReplyText(prev => ({...prev, [c.id]: e.target.value}))}
                                  onKeyDown={e => e.key === 'Enter' && handleAddReply(c.id)}
                                />
                                <button
                                  onClick={() => handleAddReply(c.id)}
                                  className="bg-violet-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-violet-600 transition"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Add a Resource</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <input className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
              <input className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="URL *" value={form.url} onChange={e => setForm({...form, url: e.target.value})}/>
              <select className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" value={form.media_type} onChange={e => setForm({...form, media_type: e.target.value})}>
                {MEDIA_TYPES.map(m => <option key={m}>{m}</option>)}
              </select>
              <textarea className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400 resize-none" placeholder="Description — why do you love this?" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
              <input className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Tags (comma separated e.g. Motivational, Computing)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}/>
              <input className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Thumbnail URL (optional — auto-fills for YouTube)" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})}/>
              <input className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" placeholder="Your username" value={form.submitted_by} onChange={e => setForm({...form, submitted_by: e.target.value})}/>
              <button onClick={handleAdd} className="bg-violet-500 text-white py-2 rounded-full font-semibold hover:bg-violet-600 transition">
                Share Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{authMode === 'login' ? 'Log In' : 'Sign Up'}</h2>
              <button onClick={() => setShowAuth(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
                placeholder="Username"
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
              />
              <input
                type="password"
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
                placeholder="Password"
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
              />
              {authError && <p className="text-red-400 text-xs">{authError}</p>}
              <button
                onClick={async () => {
                  setAuthError('')
                  const result = authMode === 'login'
                    ? await login(authForm.username, authForm.password)
                    : await signup(authForm.username, authForm.password)
                  if (result.error) {
                    setAuthError(result.error)
                  } else {
                    setCurrentUser(authForm.username)
                    setShowAuth(false)
                    setAuthForm({ username: '', password: '' })
                  }
                }}
                className="bg-violet-500 text-white py-2 rounded-full font-semibold hover:bg-violet-600 transition"
              >
                {authMode === 'login' ? 'Log In' : 'Create Account'}
              </button>
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-sm text-gray-400 hover:text-gray-600 text-center">
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRIEND ACTIVITY FEED */}
      {showFeed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-amber-50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 pb-0">
              <h2 className="font-bold text-2xl">What my friends are up to!</h2>
              <button onClick={() => setShowFeed(false)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              {feedResources.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg">No activity yet!</p>
                  <p className="text-sm mt-2">Follow some people to see what they're sharing.</p>
                  <button onClick={() => setShowFeed(false)} className="mt-4 bg-violet-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition">
                    Go explore the library
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {feedResources.map(r => (
                    <div key={r.id} onClick={() => { setShowFeed(false); handleOpenResource(r) }} className="cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition group">
                      <div className="h-44 bg-gray-100 overflow-hidden">
                        {getThumbnail(r) ? (
                          <img src={getThumbnail(r)!} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">◈</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.media_type}</p>
                        <p className="text-xs text-violet-400 mt-1">shared by {r.submitted_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}