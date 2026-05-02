'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logout } from '../../lib/auth'
import { getResources } from '../../lib/resources'

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

function getYoutubeThumbnail(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  return null
}

export default function ProfilePage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [myResources, setMyResources] = useState<Resource[]>([])
  const [selected, setSelected] = useState<Resource | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push('/')
      return
    }
    setUsername(user)
    loadMyResources(user)
  }, [])

  async function loadMyResources(user: string) {
    const all = await getResources()
    if (all) setMyResources(all.filter((r: Resource) => r.submitted_by === user))
  }

  function handleLogout() {
    logout()
    router.push('/')
  }

  const getThumbnail = (r: Resource) => r.thumbnail_url || getYoutubeThumbnail(r.url) || null

  return (
    <div className="min-h-screen bg-amber-50">
      {/* NAV */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => router.push('/')}
          className="text-violet-500 font-semibold text-sm hover:text-violet-700"
        >
          ← Back to Library
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Log out
        </button>
      </div>

      {/* PROFILE HEADER */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-24 h-24 rounded-full bg-violet-500 flex items-center justify-center text-white text-4xl">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Profile</p>
            <h1 className="text-3xl font-bold">{username}</h1>
            <p className="text-gray-400 text-sm mt-1">{myResources.length} Shared</p>
          </div>
        </div>

        {/* MY CATALOGUE */}
        <h2 className="text-2xl font-bold mb-4">My Catalogue</h2>
        {myResources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">You haven't shared anything yet!</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-violet-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition"
            >
              Go add something
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {myResources.map(r => (
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
                </div>
              </div>
            ))}
          </div>
        )}
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
                <p className="text-sm text-gray-500">Shared by <span className="font-semibold">{selected.submitted_by}</span></p>
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
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-violet-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-violet-600 transition"
              >
                Open Resource
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}