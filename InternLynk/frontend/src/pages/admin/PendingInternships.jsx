import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { useAuth } from '../../context/AuthContext'
import { logAdminAction } from '../../utils/logging'
import toast from 'react-hot-toast'
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react'

export default function PendingInternships() {
  const { profile: currentAdmin } = useAuth()
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [selectedInternship, setSelectedInternship] = useState(null)
  const [rejectInternship, setRejectInternship] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch pending internships with creator profile
  const fetchPendingInternships = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('internships')
        .select(`
          *,
          created_by_profile:created_by (
            id,
            full_name,
            organization_name,
            email,
            profile_picture
          ),
          software_house_profile:software_house_id (
            id,
            full_name,
            organization_name,
            email,
            profile_picture
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInternships(data || [])
    } catch (err) {
      console.error('Error fetching pending internships:', err)
      toast.error(err.message || 'Failed to load pending internships')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingInternships()
  }, [])

  // Approve single internship
  const handleApprove = async (internship) => {
    try {
      setActionLoadingId(internship.id)

      const creatorId = internship.created_by || internship.software_house_id
      const nowIso = new Date().toISOString()

      // 1. Update internship status
      const { error: updateError } = await supabase
        .from('internships')
        .update({
          status: 'approved',
          approved_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', internship.id)

      if (updateError) throw updateError

      // 2. Notify software house creator
      if (creatorId) {
        await supabase.from('notifications').insert({
          user_id: creatorId,
          type: 'internship_approval',
          message: `Your internship listing "${internship.title}" has been approved and is now live for students to apply!`,
          is_read: false,
          metadata: {
            internship_id: internship.id,
            status: 'approved',
            title: internship.title,
            approved_at: nowIso,
          },
        })
      }

      // 3. Log admin action
      await logAdminAction(
        'approve_internship',
        'internship',
        internship.id,
        `Approved internship "${internship.title}" posted by ${creatorId}`,
        { internshipId: internship.id, title: internship.title, creatorId }
      )

      toast.success(`Internship "${internship.title}" approved!`)
      setInternships((prev) => prev.filter((i) => i.id !== internship.id))
      if (selectedInternship?.id === internship.id) setSelectedInternship(null)
    } catch (err) {
      console.error('Error approving internship:', err)
      toast.error(err.message || 'Failed to approve internship')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Reject single internship with feedback
  const handleReject = async () => {
    if (!rejectInternship) return

    try {
      setActionLoadingId(rejectInternship.id)
      const creatorId = rejectInternship.created_by || rejectInternship.software_house_id
      const nowIso = new Date().toISOString()

      // 1. Update status
      const { error: updateError } = await supabase
        .from('internships')
        .update({
          status: 'rejected',
          updated_at: nowIso,
        })
        .eq('id', rejectInternship.id)

      if (updateError) throw updateError

      // 2. Send notification to creator
      if (creatorId) {
        const message = rejectReason.trim()
          ? `Your internship listing "${rejectInternship.title}" was not approved. Feedback: ${rejectReason.trim()}`
          : `Your internship listing "${rejectInternship.title}" was reviewed and not approved.`

        await supabase.from('notifications').insert({
          user_id: creatorId,
          type: 'internship_approval',
          message,
          is_read: false,
          metadata: {
            internship_id: rejectInternship.id,
            status: 'rejected',
            title: rejectInternship.title,
            reason: rejectReason.trim() || null,
            rejected_at: nowIso,
          },
        })
      }

      // 3. Log admin action
      await logAdminAction(
        'reject_internship',
        'internship',
        rejectInternship.id,
        `Rejected internship "${rejectInternship.title}": ${rejectReason || 'No reason given'}`,
        { internshipId: rejectInternship.id, title: rejectInternship.title, reason: rejectReason }
      )

      toast.success(`Internship "${rejectInternship.title}" rejected`)
      setInternships((prev) => prev.filter((i) => i.id !== rejectInternship.id))
      setRejectInternship(null)
      setRejectReason('')
      if (selectedInternship?.id === rejectInternship.id) setSelectedInternship(null)
    } catch (err) {
      console.error('Error rejecting internship:', err)
      toast.error(err.message || 'Failed to reject internship')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Bulk Approve All Filtered
  const handleBulkApprove = async () => {
    if (filteredInternships.length === 0) return

    if (!window.confirm(`Are you sure you want to approve all ${filteredInternships.length} pending internships?`)) {
      return
    }

    try {
      setIsBulkLoading(true)
      const ids = filteredInternships.map((i) => i.id)
      const nowIso = new Date().toISOString()

      const { error: bulkError } = await supabase
        .from('internships')
        .update({
          status: 'approved',
          approved_at: nowIso,
          updated_at: nowIso,
        })
        .in('id', ids)

      if (bulkError) throw bulkError

      // Send notifications
      const notifications = filteredInternships
        .map((i) => {
          const creatorId = i.created_by || i.software_house_id
          if (!creatorId) return null
          return {
            user_id: creatorId,
            type: 'internship_approval',
            message: `Your internship listing "${i.title}" has been approved!`,
            is_read: false,
            metadata: { internship_id: i.id, status: 'approved', title: i.title, approved_at: nowIso },
          }
        })
        .filter(Boolean)

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications)
      }

      await logAdminAction(
        'bulk_approve_internships',
        'internship',
        null,
        `Bulk approved ${ids.length} pending internships`,
        { count: ids.length, ids }
      )

      toast.success(`Successfully approved ${ids.length} internships!`)
      setInternships((prev) => prev.filter((i) => !ids.includes(i.id)))
    } catch (err) {
      console.error('Error bulk approving internships:', err)
      toast.error(err.message || 'Failed to bulk approve')
    } finally {
      setIsBulkLoading(false)
    }
  }

  // Locations list
  const uniqueLocations = useMemo(() => {
    const locs = internships.map((i) => i.location).filter(Boolean)
    return Array.from(new Set(locs))
  }, [internships])

  // Filtered internships
  const filteredInternships = useMemo(() => {
    return internships.filter((i) => {
      if (locationFilter !== 'all' && i.location !== locationFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const title = (i.title || '').toLowerCase()
        const desc = (i.description || '').toLowerCase()
        const comp = (
          i.created_by_profile?.organization_name ||
          i.software_house_profile?.organization_name ||
          i.created_by_profile?.full_name ||
          ''
        ).toLowerCase()
        return title.includes(q) || desc.includes(q) || comp.includes(q)
      }
      return true
    })
  }, [internships, locationFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Pending Internship Listings</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Review, verify, and approve internship opportunities submitted by software houses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {filteredInternships.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {isBulkLoading ? 'Approving...' : `Approve All (${filteredInternships.length})`}
            </button>
          )}
          <button
            onClick={fetchPendingInternships}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending Listings</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{internships.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Software Houses</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">
              {new Set(internships.map((i) => i.created_by || i.software_house_id).filter(Boolean)).size}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Locations</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{uniqueLocations.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by internship title, company name, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {uniqueLocations.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                aria-label="Filter by location"
                className="px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Internship Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 flex flex-col items-center justify-center">
          <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading pending internship listings...</p>
        </div>
      ) : filteredInternships.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">No Pending Listings</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            All submitted internships have been reviewed and approved!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInternships.map((internship) => {
            const companyName =
              internship.created_by_profile?.organization_name ||
              internship.software_house_profile?.organization_name ||
              internship.created_by_profile?.full_name ||
              'Software House'
            const isProcessing = actionLoadingId === internship.id

            return (
              <div
                key={internship.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 mb-2">
                        Pending Review
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{internship.title}</h3>
                      <p className="text-sm text-indigo-600 font-medium mt-0.5 flex items-center gap-1.5">
                        <Building className="w-4 h-4" />
                        {companyName}
                      </p>
                    </div>
                  </div>

                  {/* Badges / Chips */}
                  <div className="flex flex-wrap gap-2 my-3">
                    {internship.location && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {internship.location}
                      </span>
                    )}
                    {internship.stipend && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        {internship.stipend}
                      </span>
                    )}
                    {internship.duration && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {internship.duration}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{internship.description || 'No description provided.'}</p>

                  {/* Requirements preview */}
                  {internship.requirements && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-4">
                      <span className="font-semibold text-gray-700 block mb-1">Key Requirements:</span>
                      <p className="line-clamp-2">{internship.requirements}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedInternship(internship)}
                    className="p-2.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
                    title="View full listing details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setRejectInternship(internship)
                      setRejectReason('')
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Listing
                  </button>

                  <button
                    onClick={() => handleApprove(internship)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isProcessing ? 'Approving...' : 'Approve Listing'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInternship(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                Pending Approval
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedInternship.title}</h2>
              <p className="text-sm font-medium text-indigo-600 mt-1 flex items-center gap-2">
                <Building className="w-4 h-4" />
                {selectedInternship.created_by_profile?.organization_name ||
                  selectedInternship.software_house_profile?.organization_name ||
                  'Software House'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 text-xs text-gray-600 my-4">
              <div>
                <span className="text-gray-400 block">Location</span>
                <span className="font-semibold text-gray-800">{selectedInternship.location || 'Remote / N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Stipend</span>
                <span className="font-semibold text-emerald-600">{selectedInternship.stipend || 'Unpaid / N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Duration</span>
                <span className="font-semibold text-gray-800">{selectedInternship.duration || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Description</h4>
                <p className="whitespace-pre-line text-gray-600 bg-gray-50 p-4 rounded-xl">
                  {selectedInternship.description || 'No detailed description provided.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Requirements & Qualifications</h4>
                <p className="whitespace-pre-line text-gray-600 bg-gray-50 p-4 rounded-xl">
                  {selectedInternship.requirements || 'No specific requirements stated.'}
                </p>
              </div>

              <div className="text-xs text-gray-400 pt-2">
                Submitted on: {selectedInternship.created_at ? new Date(selectedInternship.created_at).toLocaleString() : 'N/A'}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedInternship(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setRejectInternship(selectedInternship)
                  setSelectedInternship(null)
                }}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-sm font-medium rounded-lg"
              >
                Reject Listing
              </button>
              <button
                onClick={() => handleApprove(selectedInternship)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm"
              >
                Approve Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Internship Listing</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to reject <span className="font-semibold text-gray-800">{rejectInternship.title}</span>?
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Feedback for Software House
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify requirements or changes required before this listing can be accepted..."
                rows={4}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectInternship(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoadingId === rejectInternship.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
