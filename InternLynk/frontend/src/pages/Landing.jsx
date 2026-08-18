import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  GraduationCap,
  Building2,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  Search,
  ChevronRight,
  Layers,
  Award,
  Globe2,
  Zap,
  Check,
} from 'lucide-react'

export default function Landing() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('students')

  const getDashboardPath = () => {
    if (!profile) return '/dashboard'
    const map = {
      student: '/dashboard/student',
      guest: '/dashboard/guest',
      university: '/dashboard/university',
      software_house: '/dashboard/software-house',
      admin: '/dashboard/admin',
    }
    return map[profile.role] || '/dashboard'
  }

  const roleFeatures = {
    students: {
      title: 'For Students & Aspiring Tech Talent',
      badge: 'Launch Your Career',
      subtitle: 'Land verified internships at leading software companies with verified institutional credentials or as an independent guest applicant.',
      cta: 'Explore Opportunities',
      ctaLink: '/listings',
      points: [
        {
          title: 'Direct Industry Opportunities',
          desc: 'Apply directly to verified tech internships posted by top software houses and startups.',
          icon: Briefcase,
        },
        {
          title: 'Structured CV Builder',
          desc: 'Create an industry-standard CV highlighting your skills, education, projects, and certifications.',
          icon: FileText,
        },
        {
          title: 'Real-Time Application Tracking',
          desc: 'Monitor the status of your applications live with transparent updates and hiring decisions.',
          icon: TrendingUp,
        },
        {
          title: 'Open to All Candidates',
          desc: 'Enrolled university student or independent learner? InternLynk provides equal access for all talent.',
          icon: Award,
        },
      ],
    },
    universities: {
      title: 'For Universities & Academic Institutions',
      badge: 'Empower Your Students',
      subtitle: 'Streamline your internship placement programs, automate student batch onboarding, and track institutional outcomes in real time.',
      cta: 'Request Institutional Access',
      ctaLink: '/login',
      points: [
        {
          title: 'Automated Bulk CSV Onboarding',
          desc: 'Enroll entire batches of graduating students in seconds with built-in validation and credential generation.',
          icon: Users,
        },
        {
          title: 'Complete Student Oversight',
          desc: 'View where your students apply, track interview requests, and monitor successful placements.',
          icon: ShieldCheck,
        },
        {
          title: 'Institutional Analytics',
          desc: 'Generate real-time reports on placement rates, top hiring sectors, and student engagement.',
          icon: TrendingUp,
        },
        {
          title: 'Verified Academic Credentials',
          desc: 'Empower employers with verified student degrees, batches, and academic performance data.',
          icon: GraduationCap,
        },
      ],
    },
    companies: {
      title: 'For Software Houses & Tech Employers',
      badge: 'Hire Top Tech Talent',
      subtitle: 'Access pre-verified candidates from premier universities and hire skilled interns ready to make an immediate impact.',
      cta: 'Register Your Company',
      ctaLink: '/signup',
      points: [
        {
          title: 'Targeted Internship Listings',
          desc: 'Post roles with specific tech requirements, durations, stipends, and location preferences.',
          icon: Briefcase,
        },
        {
          title: 'Pre-Screened Talent Pipeline',
          desc: 'Filter candidates by university, verified degree programs, specific skills, and structured CVs.',
          icon: Search,
        },
        {
          title: 'Streamlined Applicant Review',
          desc: 'Review submissions in a unified portal, compare candidate profiles, and manage hiring stages.',
          icon: Layers,
        },
        {
          title: 'One-Click Decision & Feedback',
          desc: 'Accept or decline candidates with optional custom feedback to foster strong candidate relationships.',
          icon: CheckCircle2,
        },
      ],
    },
  }

  const currentFeature = roleFeatures[activeTab]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="font-black text-lg tracking-tight">IL</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 leading-none tracking-tight">InternLynk</span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-0.5">Internship Linkage</span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">For You</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <Link to="/listings" className="hover:text-blue-600 transition-colors">Browse Internships</Link>
          </nav>

          {/* Right CTA Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-indigo-50/70 via-blue-50/40 to-slate-50">
        {/* Background Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Gen Academic & Industry Linkage</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Where Top Tech Talent Meets{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                Leading Software Houses
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              InternLynk bridges university academia with the software industry. Connecting verified students and aspiring developers to high-impact internships with verified track records.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/listings"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Explore Internships</span>
              </Link>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-base shadow-sm transition-all hover:shadow hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Register Company / Guest</span>
              </Link>
            </div>

            {/* Trust Badges / Stats */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              {[
                { label: 'Verified Companies', value: '500+' },
                { label: 'Students & Applicants', value: '10,000+' },
                { label: 'Partner Universities', value: '50+' },
                { label: 'Placement Success Rate', value: '95%' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-blue-200 transition-colors">
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">{stat.value}</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Audience Role Selector Section ── */}
      <section id="roles" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Tailored Platform Experience</h2>
            <p className="text-3xl font-bold text-slate-900 sm:text-4xl tracking-tight">
              Designed for every stakeholder in the ecosystem
            </p>
            <p className="text-slate-600 text-base">
              Explore how InternLynk creates seamless value for students, universities, and hiring organizations.
            </p>

            {/* Tabs */}
            <div className="inline-flex p-1.5 rounded-xl bg-slate-100 border border-slate-200 mt-6 gap-1">
              {[
                { id: 'students', label: 'Students & Guests', icon: GraduationCap },
                { id: 'universities', label: 'Universities', icon: Building2 },
                { id: 'companies', label: 'Software Houses', icon: Briefcase },
              ].map((tab) => {
                const Icon = tab.icon
                const isSelected = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Tab Content Card */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Heading & Points */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-3">
                    {currentFeature.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{currentFeature.title}</h3>
                  <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
                    {currentFeature.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {currentFeature.points.map((pt, idx) => {
                    const Icon = pt.icon
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{pt.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{pt.desc}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2">
                  <Link
                    to={currentFeature.ctaLink}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    <span>{currentFeature.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Feature Box */}
              <div className="lg:col-span-5 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-950 rounded-xl p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-[11px] font-mono text-blue-200/60 uppercase">InternLynk Portal</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-blue-200 font-mono">Status: Active Linkage</p>
                    <p className="text-sm font-bold mt-1 text-white">Direct Verified Placement</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>End-to-end applicant tracking pipeline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Automated email & system notifications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Integrated CV profiles & skill match tags</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Role-based authorization and gating</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                  <span>99.9% Uptime</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live System
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Platform Features ── */}
      <section id="features" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Core Capabilities</h2>
            <p className="text-3xl font-bold text-slate-900 sm:text-4xl tracking-tight">
              Everything required for seamless tech placements
            </p>
            <p className="text-slate-600 text-base">
              Built specifically to eliminate friction between academic programs and industrial engineering teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Intelligent Matching & CV Formats</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Students build standardized, comprehensive CVs containing structured projects, skills, education, and credentials that software houses can evaluate in seconds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600 flex items-center gap-1">
                <span>Standardized CV Standards</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Admin-Approved Authenticity</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every software house account and posted internship undergoes platform administrator review, ensuring only legitimate, high-quality career opportunities are listed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                <span>Vetted Opportunities</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Transparent Analytics & Logs</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Universities and platform admins gain real-time metrics on application statuses, student success ratios, and comprehensive audit logs of all platform activities.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span>Real-Time Visibility</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Simple Workflow</h2>
            <p className="text-3xl font-bold text-slate-900 sm:text-4xl tracking-tight">
              How InternLynk Works in 4 Steps
            </p>
            <p className="text-slate-600 text-base">
              A frictionless journey from platform registration to confirmed placement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Sign In / Register',
                desc: 'Log in with your university credentials or register as a company or independent guest.',
              },
              {
                step: '02',
                title: 'Build Profile or Post Role',
                desc: 'Students create a standardized CV; Software Houses post approved tech internship roles.',
              },
              {
                step: '03',
                title: 'Browse & Apply',
                desc: 'Candidates discover matching openings and submit customized cover letters with one click.',
              },
              {
                step: '04',
                title: 'Review & Get Placed',
                desc: 'Hiring teams review applications, give feedback, and finalize internship offers.',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-3xl font-black text-blue-600/30 block font-mono">{step.step}</span>
                <h4 className="text-base font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── High Impact Bottom CTA Banner ── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Transform Your Internship Linkages?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking software houses and top universities collaborating on InternLynk today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-base shadow-lg shadow-black/10 transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <span>Get Started for Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base backdrop-blur-sm transition-all inline-flex items-center justify-center"
            >
              Sign In to Your Portal
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  IL
                </div>
                <span className="font-bold text-white text-base">InternLynk</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Academic-Industry Internship &amp; Talent Linkage Platform. Connecting academia with tech employers.
              </p>
            </div>

            {/* Column 2: Portals */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">User Portals</p>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-white transition">Student Login</Link></li>
                <li><Link to="/login" className="hover:text-white transition">University Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Software House Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Administrator Access</Link></li>
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Explore</p>
              <ul className="space-y-2 text-xs">
                <li><Link to="/listings" className="hover:text-white transition">Open Tech Internships</Link></li>
                <li><Link to="/signup" className="hover:text-white transition">Register Software House</Link></li>
                <li><Link to="/signup" className="hover:text-white transition">Guest Applicant Signup</Link></li>
              </ul>
            </div>

            {/* Column 4: Platform Security */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform Integrity</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                All employer accounts and internship listings undergo platform verification to ensure student security and authenticity.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} InternLynk. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 transition cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-400 transition cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
