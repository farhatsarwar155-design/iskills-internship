import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'

const INITIAL_FORM = {
  title: '',
  description: '',
  requirements: '',
  location: '',
  duration: '',
  stipend: '',
}

export default function PostInternship() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  function validate() {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    if (!form.requirements.trim()) newErrors.requirements = 'Requirements are required'
    if (!form.location.trim()) newErrors.location = 'Location is required'
    if (!form.duration.trim()) newErrors.duration = 'Duration is required'
    if (form.stipend !== '' && isNaN(Number(form.stipend))) newErrors.stipend = 'Stipend must be a number'
    return newErrors
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setSubmitting(true)
      setSubmitError(null)

      const { error } = await supabase.from('internships').insert({
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        location: form.location.trim(),
        duration: form.duration.trim(),
        stipend: form.stipend !== '' ? Number(form.stipend) : null,
        status: 'pending',
        software_house_id: user.id,
        created_by: user.id,
        skills: [],
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      setSuccess(true)
      setForm(INITIAL_FORM)
    } catch (err) {
      console.error('Post internship error:', err)
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setSuccess(false)
    setForm(INITIAL_FORM)
    setErrors({})
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submitted for Admin Approval</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your internship posting has been submitted. It will be visible to students once an admin approves it.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              Post Another
            </button>
            <button
              onClick={() => navigate('/software-house/internships')}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              My Internships
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fieldClass = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
      errors[field] ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'
    }`

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Post New Internship</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill in the details below. Your posting will be reviewed by an admin before going live.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-7">
          {submitError && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-rose-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Internship Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer Intern"
                className={fieldClass('title')}
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the internship role, responsibilities, and what interns will learn..."
                className={fieldClass('description')}
              />
              {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={4}
                placeholder="List required skills, technologies, qualifications, etc."
                className={fieldClass('requirements')}
              />
              {errors.requirements && <p className="mt-1 text-xs text-rose-600">{errors.requirements}</p>}
            </div>

            {/* Location + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Lahore / Remote"
                  className={fieldClass('location')}
                />
                {errors.location && <p className="mt-1 text-xs text-rose-600">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duration <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="e.g. 3 months, 6 weeks"
                  className={fieldClass('duration')}
                />
                {errors.duration && <p className="mt-1 text-xs text-rose-600">{errors.duration}</p>}
              </div>
            </div>

            {/* Stipend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monthly Stipend (PKR)
                <span className="text-gray-400 font-normal ml-1">— optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
                <input
                  type="number"
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className={`${fieldClass('stipend')} pl-12`}
                />
              </div>
              {errors.stipend && <p className="mt-1 text-xs text-rose-600">{errors.stipend}</p>}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post Internship
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setForm(INITIAL_FORM); setErrors({}) }}
                className="px-5 py-3 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
