import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'
import {
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Code,
  FolderGit2,
  Award,
  Globe,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Sparkles,
} from 'lucide-react'

const SUGGESTED_SKILLS = [
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'Tailwind CSS',
  'HTML/CSS',
  'Git & GitHub',
  'REST APIs',
  'Docker',
  'Next.js',
  'Java',
  'C++',
  'UI/UX Design',
  'Agile / Scrum',
]

export default function CVForm() {
  const { user, profile } = useAuth()

  // Tab mode: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState('edit')

  // Form states
  const [personal, setPersonal] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
  })

  const [education, setEducation] = useState([])
  const [experience, setExperience] = useState([])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [projects, setProjects] = useState([])
  const [certifications, setCertifications] = useState([])
  const [languages, setLanguages] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [cvId, setCvId] = useState(null)

  // Load CV on mount or when user changes
  useEffect(() => {
    async function loadCV() {
      if (!user?.id) return
      setLoading(true)
      try {
        // Attempt to fetch from cv_forms
        const { data, error } = await supabase
          .from('cv_forms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.warn('[CVForm] fetch cv_forms error:', error)
        }

        if (data) {
          setCvId(data.id)
          if (data.personal) {
            setPersonal({
              name: data.personal.name || profile?.full_name || '',
              email: data.personal.email || profile?.email || user.email || '',
              phone: data.personal.phone || '',
              location: data.personal.location || '',
              linkedin: data.personal.linkedin || '',
              github: data.personal.github || '',
              portfolio: data.personal.portfolio || '',
              summary: data.personal.summary || '',
            })
          }
          if (Array.isArray(data.education)) setEducation(data.education)
          if (Array.isArray(data.experience)) setExperience(data.experience)
          if (Array.isArray(data.skills)) {
            setSkills(data.skills)
          } else if (typeof data.skills === 'string') {
            setSkills(data.skills.split(',').map((s) => s.trim()).filter(Boolean))
          }
          if (Array.isArray(data.projects)) setProjects(data.projects)
          if (Array.isArray(data.certifications)) setCertifications(data.certifications)
          if (Array.isArray(data.languages)) setLanguages(data.languages)
        } else {
          // Pre-populate defaults from profile
          setPersonal((prev) => ({
            ...prev,
            name: profile?.full_name || '',
            email: profile?.email || user.email || '',
          }))
        }
      } catch (err) {
        console.error('[CVForm] unexpected error during load:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCV()
  }, [user?.id, profile])

  // Calculate completion percentage
  const calculateCompletion = () => {
    let score = 0
    if (personal.name && personal.email) score += 25
    if (personal.summary) score += 10
    if (personal.phone || personal.location) score += 10
    if (education.length > 0) score += 25
    if (skills.length > 0) score += 15
    if (experience.length > 0 || projects.length > 0) score += 15
    return Math.min(100, score)
  }

  const completionScore = calculateCompletion()

  // Skill management
  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || newSkill).trim()
    if (!s) return
    if (!skills.includes(s)) {
      setSkills([...skills, s])
    }
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  // Education handlers
  const handleAddEducation = () => {
    setEducation([
      ...education,
      {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        grade: '',
        description: '',
      },
    ])
  }

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
  }

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  // Experience handlers
  const handleAddExperience = () => {
    setExperience([
      ...experience,
      {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ])
  }

  const handleUpdateExperience = (index, field, value) => {
    const updated = [...experience]
    updated[index] = { ...updated[index], [field]: value }
    setExperience(updated)
  }

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index))
  }

  // Project handlers
  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        title: '',
        technologies: '',
        link: '',
        description: '',
      },
    ])
  }

  const handleUpdateProject = (index, field, value) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  // Certification handlers
  const handleAddCert = () => {
    setCertifications([
      ...certifications,
      {
        title: '',
        issuer: '',
        issueDate: '',
        link: '',
      },
    ])
  }

  const handleUpdateCert = (index, field, value) => {
    const updated = [...certifications]
    updated[index] = { ...updated[index], [field]: value }
    setCertifications(updated)
  }

  const handleRemoveCert = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  // Language handlers
  const handleAddLanguage = () => {
    setLanguages([
      ...languages,
      {
        language: '',
        proficiency: 'Conversational',
      },
    ])
  }

  const handleUpdateLanguage = (index, field, value) => {
    const updated = [...languages]
    updated[index] = { ...updated[index], [field]: value }
    setLanguages(updated)
  }

  const handleRemoveLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  // Save CV to Supabase
  const handleSave = async () => {
    setToast(null)

    if (!personal.name.trim()) {
      setToast({ type: 'error', message: 'Full name is required in Personal Info.' })
      return
    }
    if (!personal.email.trim()) {
      setToast({ type: 'error', message: 'Email address is required in Personal Info.' })
      return
    }

    setSaving(true)
    try {
      const isComplete = Boolean(
        personal.name.trim() &&
        personal.email.trim() &&
        education.length > 0 &&
        skills.length > 0
      )

      const payload = {
        user_id: user.id,
        personal,
        education,
        experience,
        skills,
        projects,
        certifications,
        languages,
        is_complete: isComplete,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('cv_forms')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        throw error
      }

      if (data?.id) {
        setCvId(data.id)
      }

      setToast({
        type: 'success',
        message: 'Your CV profile has been saved successfully!',
      })

      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      console.error('[CVForm] save error:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to save CV. Please check your connection.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading your CV profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Standardized CV Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Curriculum Vitae (CV)</h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Keep your skills, projects, and educational credentials complete. Software houses evaluate this standardized CV when you apply.
          </p>
        </div>

        {/* Action Toggle & Save Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-xs flex items-center gap-1">
            <button
              onClick={() => setActiveTab('edit')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'edit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit CV</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Status / Toast Feedback ── */}
      {toast && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* ── Completion Progress Bar ── */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-2">
          <span>Profile Strength</span>
          <span className={`${completionScore >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {completionScore}% Complete
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completionScore >= 75
                ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                : 'bg-gradient-to-r from-amber-400 to-blue-500'
            }`}
            style={{ width: `${completionScore}%` }}
          />
        </div>
        {completionScore < 75 && (
          <p className="text-[11px] text-gray-500 mt-2">
            Tip: Add your education, projects, and core technical skills to maximize interview invitations.
          </p>
        )}
      </div>

      {activeTab === 'edit' ? (
        /* ═══════════════════════════════════════════════════════════════ */
        /* EDIT MODE                                                       */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-8">
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                <p className="text-xs text-gray-500">Your core contact details and brief bio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={personal.name}
                  onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  placeholder="jane.doe@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  value={personal.location}
                  onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
                  placeholder="e.g. Islamabad, Pakistan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={personal.linkedin}
                  onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={personal.github}
                  onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Portfolio / Personal Website URL
                </label>
                <input
                  type="url"
                  value={personal.portfolio}
                  onChange={(e) => setPersonal({ ...personal, portfolio: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Professional Summary / Bio
                </label>
                <textarea
                  rows={4}
                  value={personal.summary}
                  onChange={(e) => setPersonal({ ...personal, summary: e.target.value })}
                  placeholder="Enthusiastic Computer Science student passionate about full-stack web development and AI. Seeking a software engineering internship to contribute clean code and learn from seasoned engineering teams..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Education */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Education</h2>
                  <p className="text-xs text-gray-500">Degree, institution, and graduation timeline</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddEducation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {education.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No education entries added yet.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click "Add Education" to specify your degree or diploma.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {education.map((edu, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Education #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="text-gray-400 hover:text-rose-600 transition p-1"
                        title="Remove education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Degree / Program
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                          placeholder="e.g. Bachelor of Science in Computer Science"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                          placeholder="e.g. National University of Sciences and Technology"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Field of Study / Major
                        </label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => handleUpdateEducation(idx, 'fieldOfStudy', e.target.value)}
                          placeholder="e.g. Software Engineering"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          CGPA / Grade
                        </label>
                        <input
                          type="text"
                          value={edu.grade}
                          onChange={(e) => handleUpdateEducation(idx, 'grade', e.target.value)}
                          placeholder="e.g. 3.75 / 4.0"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date / Year
                        </label>
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) => handleUpdateEducation(idx, 'startDate', e.target.value)}
                          placeholder="e.g. 2022"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End Date / Expected Graduation
                        </label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => handleUpdateEducation(idx, 'endDate', e.target.value)}
                          placeholder="e.g. 2026 (Expected)"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Technical & Soft Skills */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Skills & Competencies</h2>
                <p className="text-xs text-gray-500">Add technical languages, frameworks, and domain skills</p>
              </div>
            </div>

            {/* Add Skill Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="Type a skill and press Enter (e.g. React, PostgreSQL, Python)"
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
              >
                Add Skill
              </button>
            </div>

            {/* Selected Skills Chips */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Your Skills ({skills.length})
              </p>
              {skills.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No skills added yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-emerald-500 hover:text-rose-600 transition"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Skills Quick-Add */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Suggested Popular Skills (Click to add)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 text-xs font-medium transition"
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                    <span>{skill}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Work & Internship Experience */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Experience & Internships</h2>
                  <p className="text-xs text-gray-500">Past jobs, internships, freelance or volunteer roles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            {experience.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No work experience added.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Optional for fresh students, but highly recommended.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {experience.map((exp, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                        Position #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="text-gray-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Role / Title
                        </label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                          placeholder="e.g. Frontend Intern / Junior Developer"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                          placeholder="e.g. Apex Software House"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                          placeholder="e.g. Jun 2023"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End Date
                        </label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                          placeholder="e.g. Aug 2023 (or Present)"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Key Responsibilities & Achievements
                        </label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                          placeholder="Built responsive landing pages in React; Collaborated in daily standups..."
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Projects */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Projects</h2>
                  <p className="text-xs text-gray-500">Academic, open-source, or personal software projects</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <FolderGit2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No projects added yet.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Projects demonstrate hands-on coding capabilities.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                        Project #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(idx)}
                        className="text-gray-400 hover:text-rose-600 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                          placeholder="e.g. AI-Powered Internship Linkage Portal"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Technologies Used
                        </label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => handleUpdateProject(idx, 'technologies', e.target.value)}
                          placeholder="e.g. React, Node.js, Supabase, Tailwind CSS"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          GitHub / Demo Link
                        </label>
                        <input
                          type="url"
                          value={proj.link}
                          onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                          placeholder="https://github.com/username/project"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Project Description & Highlights
                        </label>
                        <textarea
                          rows={3}
                          value={proj.description}
                          onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                          placeholder="Developed a multi-tenant portal with JWT authentication, role-based dashboards, and real-time alerts..."
                          className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Certifications & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Certifications</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add
                </button>
              </div>

              {certifications.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">No certifications added.</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(idx)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => handleUpdateCert(idx, 'title', e.target.value)}
                        placeholder="Certificate Title (e.g. AWS Certified Practitioner)"
                        className="w-full px-2.5 py-1.5 bg-white rounded border border-gray-200 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => handleUpdateCert(idx, 'issuer', e.target.value)}
                          placeholder="Issuer (e.g. Coursera / AWS)"
                          className="w-full px-2.5 py-1.5 bg-white rounded border border-gray-200 text-xs"
                        />
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => handleUpdateCert(idx, 'issueDate', e.target.value)}
                          placeholder="Year (e.g. 2023)"
                          className="w-full px-2.5 py-1.5 bg-white rounded border border-gray-200 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Languages</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                >
                  + Add
                </button>
              </div>

              {languages.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">No languages added.</p>
              ) : (
                <div className="space-y-3">
                  {languages.map((lang, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                      <input
                        type="text"
                        value={lang.language}
                        onChange={(e) => handleUpdateLanguage(idx, 'language', e.target.value)}
                        placeholder="Language (e.g. English)"
                        className="flex-1 px-2.5 py-1.5 bg-white rounded border border-gray-200 text-xs"
                      />
                      <select
                        value={lang.proficiency}
                        onChange={(e) => handleUpdateLanguage(idx, 'proficiency', e.target.value)}
                        className="px-2.5 py-1.5 bg-white rounded border border-gray-200 text-xs"
                      >
                        <option value="Native / Bilingual">Native</option>
                        <option value="Fluent / Professional">Fluent</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Basic">Basic</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguage(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Complete CV</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* PREVIEW MODE                                                    */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sm:p-12 space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Resume Header */}
          <div className="border-b border-gray-200 pb-6 space-y-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {personal.name || 'Candidate Full Name'}
            </h1>
            {personal.summary && (
              <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                {personal.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
              {personal.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  {personal.email}
                </span>
              )}
              {personal.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {personal.phone}
                </span>
              )}
              {personal.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {personal.location}
                </span>
              )}
              {personal.linkedin && (
                <a
                  href={personal.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              )}
              {personal.github && (
                <a
                  href={personal.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-gray-800 hover:underline"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              )}
              {personal.portfolio && (
                <a
                  href={personal.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>

          {/* Education Preview */}
          {education.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {edu.degree || 'Degree Program'}
                        {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">{edu.institution || 'University'}</p>
                      {edu.grade && <p className="text-xs text-gray-500 mt-0.5">CGPA / Grade: {edu.grade}</p>}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {edu.startDate || ''} {edu.endDate ? `– ${edu.endDate}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Preview */}
          {skills.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                Technical & Core Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Preview */}
          {experience.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                Work Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <p className="font-bold text-gray-900 text-sm">
                        {exp.title} <span className="text-gray-500 font-normal">at {exp.company}</span>
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ''}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Preview */}
          {projects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                Projects
              </h2>
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{proj.title}</span>
                      {proj.technologies && (
                        <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded">
                          {proj.technologies}
                        </span>
                      )}
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-400 hover:text-blue-600 inline-flex items-center gap-0.5 ml-auto"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Languages Preview */}
          {(certifications.length > 0 || languages.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {certifications.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                    Certifications
                  </h2>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {certifications.map((c, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="font-semibold">{c.title}</span>
                        <span className="text-gray-400">{c.issuer} {c.issueDate ? `(${c.issueDate})` : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {languages.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-1">
                    Languages
                  </h2>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {languages.map((l, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="font-semibold">{l.language}</span>
                        <span className="text-gray-500">{l.proficiency}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
