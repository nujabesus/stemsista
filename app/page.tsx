'use client'

import { useState, useEffect } from 'react'
import { getResources, addResource, upvoteResource, searchResources } from '../lib/resources'

const CATEGORIES = [
  'Motivational', 'Women of Colour', 'Neurodivergent', 'Computing',
  'Maths', 'Engineering', 'Tech', 'News', 'Self Discovery', 'Career'
]

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

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([])
  const [featured, setFeatured] = useState<Resource | null>(null)
  const [selected, setSelected] = useState<Resource | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '', url: '', media_type: 'Video',
    description: '', tags: '', thumbnail_url: '', submitted_by: ''
  })

  useEffect(() => { loadResources() }, [])

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
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <button className="bg-violet-500 text-white px-4 py-2 rounded-full font-semibold text-sm">
            Friend Activity
          </button>
          <button
            onClick={() => setShowTags(!showTags)}
            className="text-sm font-semibold underline text-gray-700 ml-2"
          >
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
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center text-2xl font-light shadow"
          >+</button>
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
          <button
            onClick={randomize}
            className="bg-violet-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition"
          >
            Randomize
          </button>
        </div>

        {featured ? (
          <div
            onClick={() => setSelected(featured)}
            className="w-full h-64 rounded-2xl overflow-hidden mb-6 cursor-pointer relative group"
          >
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
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              className="cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition group"
            >
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
                <button
                  onClick={e => { e.stopPropagation(); handleUpvote(r) }}
                  className="mt-2 text-xs text-violet-500 font-semibold hover:text-violet-700"
                >
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
              <button onClick={() => setSelected(null)} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {getThumbnail(selected) && (
              <div className="mx-6 mt-4 rounded-xl overflow-hidden h-56">
                <img src={getThumbnail(selected)!} alt={selected.title} className="w-full h-full object-cover"/>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Shared by <span className="font-semibold">{selected.submitted_by || 'anonymous'}</span></p>
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
              <div className="flex gap-3">
                
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-violet-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition"
                >
                  Open Resource
                </a>
                <button
                  onClick={() => handleUpvote(selected)}
                  className="border border-violet-300 text-violet-500 px-5 py-2 rounded-full text-sm font-semibold hover:bg-violet-50 transition"
                >
                  👍 {selected.upvotes}
                </button>
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
    </div>
  )
}