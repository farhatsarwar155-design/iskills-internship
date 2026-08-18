import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 9

// ─── Helpers ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
}

// ─── Apply Modal ─────────────────────────────────────────────────────────────

function ApplyModal({ internship, onClose }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [coverLetter, setCoverLetter] = useState('')
  const [toast, setToast] = useState(null)

  const applyMutation = useMutation({
    mutationFn: async () => {
      // Check for existing application
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('internship_id', internship.id)
        .maybeSingle()

      if (existing) throw new Error('You have already applied to this internship.')

      const { error } = await supabase.from('applications').insert({
        user_id: user.id,
        internship_id: internship.id,
        cover_letter: coverLetter.trim(),
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-applications'])
      setToast({ type: 'success', msg: 'Application submitted successfully!' })
      setTimeout(onClose, 1800)
    },
    onError: (err) => {
      setToast({ type: 'error', msg: err.message })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Apply for Internship</h2>
            <p className="text-sm text-gray-500">{internship.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {toast && (
            <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {toast.msg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={7}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Internship Card ──────────────────────────────────────────────────────────

function InternshipCard({ internship, onApply }) {
  const company = internship.profiles?.organization_name || 'Unknown Company'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Top */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-base leading-snug line-clamp-2">{internship.title}</h3>
          <p className="text-sm text-indigo-600 font-medium mt-0.5">{company}</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Open
        </span>
      </div>

      {/* Description excerpt */}
      <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
        {internship.description || 'No description provided.'}
      </p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        {internship.location && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {internship.location}
          </span>
        )}
        {internship.duration && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {internship.duration}
          </span>
        )}
        {internship.stipend && (
          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {internship.stipend}
          </span>
        )}
      </div>

      {/* Apply */}
      <button
        onClick={() => onApply(internship)}
        className="mt-auto w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
      >
        Apply Now
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Listings() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterDuration, setFilterDuration] = useState('')
  const [page, setPage] = useState(1)
  const [applyTarget, setApplyTarget] = useState(null)

  // Fetch approved internships + company info
  const { data: internships = [], isLoading, isError } = useQuery({
    queryKey: ['approved-internships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select(`
          id, title, description, requirements, duration, location, stipend, created_at, created_by,
          profiles:created_by ( organization_name )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 2,
  })

  // Derive unique filter options
  const locations = useMemo(
    () => [...new Set(internships.map((i) => i.location).filter(Boolean))].sort(),
    [internships]
  )
  const durations = useMemo(
    () => [...new Set(internships.map((i) => i.duration).filter(Boolean))].sort(),
    [internships]
  )

  // Apply filters
  const filtered = useMemo(() => {
    return internships.filter((i) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.profiles?.organization_name?.toLowerCase().includes(q)
      const matchLocation = !filterLocation || i.location === filterLocation
      const matchDuration = !filterDuration || i.duration === filterDuration
      return matchSearch && matchLocation && matchDuration
    })
  }, [internships, search, filterLocation, filterDuration])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-6">
      {/* Apply modal */}
      {applyTarget && (
        <ApplyModal internship={applyTarget} onClose={() => setApplyTarget(null)} />
      )}

      {/* Page header */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h1 className="text-2xl font-bold text-gray-800">Internship Listings</h1>
        <p className="text-gray-500 mt-1">Browse and apply to approved internships from top companies.</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              placeholder="Search by title, keyword, or company..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location filter */}
          <select
            value={filterLocation}
            onChange={(e) => { setFilterLocation(e.target.value); resetPage() }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Duration filter */}
          <select
            value={filterDuration}
            onChange={(e) => { setFilterDuration(e.target.value); resetPage() }}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Durations</option>
            {durations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Clear filters */}
          {(search || filterLocation || filterDuration) && (
            <button
              onClick={() => { setSearch(''); setFilterLocation(''); setFilterDuration(''); resetPage() }}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        <p className="mt-3 text-xs text-gray-400">
          {filtered.length} internship{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-600">
          Failed to load internships. Please try refreshing the page.
        </div>
      ) : paginated.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 text-lg">No internships found</h3>
            <p className="text-gray-400 text-sm mt-1">
              {search || filterLocation || filterDuration
                ? 'Try adjusting your search filters.'
                : 'Check back later for new opportunities.'}
            </p>
          </div>
          {(search || filterLocation || filterDuration) && (
            <button
              onClick={() => { setSearch(''); setFilterLocation(''); setFilterDuration(''); resetPage() }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginated.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onApply={user ? setApplyTarget : () => {}}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                    n === page
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
