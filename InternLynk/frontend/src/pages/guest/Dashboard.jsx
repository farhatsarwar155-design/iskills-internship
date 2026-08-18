import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Building,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  UserCheck
} from 'lucide-react'

// ─── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  'bg-amber-100 text-amber-800 border-amber-200',
    accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, colorBg, colorText, icon, to }) {
  const content = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorBg} ${colorText} flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )

  return to ? <Link to={to} className="block">{content}</Link> : content
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-xs text-gray-500">Loading guest portal data...</p>
    </div>
  )
}

export default function GuestDashboard() {
  const { user, profile } = useAuth()

  // 1. Fetch guest applications with joined internship details
  const { data: applications = [], isLoading: appsLoading, isError: appsError } = useQuery({
    queryKey: ['guest-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, created_at, internship_id, internships(id, title, location, duration, stipend)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user?.id,
  })

  // 2. Fetch available active listings count and featured internships
  const { data: availableListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['guest-featured-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select('id, title, description, requirements, duration, location, stipend, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data ?? []
    },
  })

  // Derived stats
  const totalApps    = applications.length
  const pendingApps  = applications.filter(a => a.status === 'pending').length
  const acceptedApps = applications.filter(a => a.status === 'accepted').length
  const rejectedApps = applications.filter(a => a.status === 'rejected').length
  const activeListingsCount = availableListings.length

  const recentApps = applications.slice(0, 5)
  const firstName = profile?.full_name?.split(' ')[0] || 'Guest'

  return (
    <div className="space-y-8 pb-12">
      {/* ── Guest Portal Welcome Banner ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Guest Portal
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                <UserCheck className="w-3 h-3 mr-1" />
                External Applicant
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="mt-2 text-blue-100 text-sm leading-relaxed">
              Explore verified tech internships, build your CV profile, and apply directly to top software houses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg text-sm shadow-sm hover:bg-blue-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Find Internships
            </Link>
            <Link
              to="/cv"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-4 py-2.5 rounded-lg text-sm border border-white/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Complete CV
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          label="Total Applications"
          value={appsLoading ? '—' : totalApps}
          colorBg="bg-blue-50"
          colorText="text-blue-600"
          to="/applications"
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          label="Pending Review"
          value={appsLoading ? '—' : pendingApps}
          colorBg="bg-amber-50"
          colorText="text-amber-600"
          to="/applications"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          label="Accepted"
          value={appsLoading ? '—' : acceptedApps}
          colorBg="bg-emerald-50"
          colorText="text-emerald-600"
          to="/applications"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <StatCard
          label="Active Listings"
          value={listingsLoading ? '—' : (activeListingsCount > 0 ? `${activeListingsCount}+` : '0')}
          colorBg="bg-indigo-50"
          colorText="text-indigo-600"
          to="/listings"
          icon={<Briefcase className="w-6 h-6" />}
        />
      </div>

      {/* ── Main Content Grid: Recent Applications & Featured Opportunities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Submitted Applications</h2>
              <p className="text-xs text-gray-500">Track progress and status decisions from hiring teams</p>
            </div>
            <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
              View All &rarr;
            </Link>
          </div>

          {appsLoading ? (
            <Spinner />
          ) : appsError ? (
            <p className="text-sm text-rose-500 text-center py-8">Failed to load applications.</p>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No applications submitted yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Browse our marketplace of internships and apply with your AIILP profile.
              </p>
              <Link
                to="/listings"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Search className="w-3.5 h-3.5" />
                Browse Open Listings
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="text-left font-semibold pb-3 pr-4">Internship Position</th>
                    <th className="text-left font-semibold pb-3 pr-4">Location</th>
                    <th className="text-left font-semibold pb-3 pr-4">Status</th>
                    <th className="text-right font-semibold pb-3">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-gray-900">
                        {app.internships?.title ?? 'Internship Listing'}
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {app.internships?.location || 'Remote'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 text-right text-xs text-gray-500">
                        {new Date(app.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Column: Guest Portal Highlights & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm pb-2 border-b border-gray-100">
              Quick Shortcuts
            </h3>
            <div className="space-y-2.5">
              {[
                { to: '/listings', label: 'Explore Listings', desc: 'Find open internships', icon: <Search className="w-4 h-4 text-blue-600" /> },
                { to: '/cv', label: 'Update CV / Resume', desc: 'Highlight your top skills', icon: <FileText className="w-4 h-4 text-indigo-600" /> },
                { to: '/guest/analytics', label: 'View Analytics', desc: 'Track response metrics', icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
                { to: '/guest/settings', label: 'Account Settings', desc: 'Password and profile info', icon: <ShieldCheck className="w-4 h-4 text-purple-600" /> },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Guest Information / Verification Card */}
          <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Guest Portal Notice</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              As a guest user, you have direct access to search, discover, and apply to all public internship postings across the AIILP network.
            </p>
          </div>
        </div>
      </div>

      {/* ── Featured Internships Section ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Featured Internship Opportunities</h2>
            <p className="text-xs text-gray-500">Newly approved positions ready for applicant submissions</p>
          </div>
          <Link
            to="/listings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <span>Explore all positions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {listingsLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading listings...</div>
        ) : availableListings.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No active listings right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableListings.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-gray-900 leading-snug">{item.title}</h4>
                    {item.stipend && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.stipend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {item.description || 'Join this exciting internship role to gain real-world industry experience.'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {item.location || 'Remote'}
                  </span>
                  <Link
                    to="/listings"
                    className="font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-0.5"
                  >
                    <span>View & Apply</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
