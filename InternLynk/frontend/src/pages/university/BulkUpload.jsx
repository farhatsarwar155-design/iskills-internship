import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../utils/supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Papa from 'papaparse'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Users
} from 'lucide-react'

// CSV Template content for downloading
const SAMPLE_CSV_HEADERS = ['name', 'email', 'student_id', 'batch', 'degree_program', 'semester']
const SAMPLE_CSV_DATA = [
  ['Alex Johnson', 'alex.johnson@university.edu', 'STU-2024-001', '2024', 'BS Computer Science', '6'],
  ['Sarah Williams', 'sarah.williams@university.edu', 'STU-2024-002', '2024', 'BS Software Engineering', '6'],
  ['Michael Chen', 'michael.chen@university.edu', 'STU-2024-003', '2023', 'BS Data Science', '8'],
  ['Fatima Zahra', 'fatima.zahra@university.edu', 'STU-2024-004', '2024', 'BS Information Technology', '5'],
]

export default function BulkUpload() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // State
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [parsedData, setParsedData] = useState([])
  const [parseErrors, setParseErrors] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [expandedLogId, setExpandedLogId] = useState(null)
  const fileInputRef = useRef(null)

  // Fetch upload history for this university
  const { data: uploadHistory = [], isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['university-bulk-uploads', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bulk_uploads')
        .select('*')
        .eq('university_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Table might not exist or RLS policy issue, fail gracefully
        console.warn('[BulkUpload] Could not fetch bulk_uploads:', error.message)
        return []
      }
      return data ?? []
    },
  })

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent = [
      SAMPLE_CSV_HEADERS.join(','),
      ...SAMPLE_CSV_DATA.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'student_bulk_upload_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Sample template downloaded')
  }

  // Normalize column names (student_name -> name, student_email -> email, roll_no / roll_number -> student_id)
  const normalizeKey = (key) => {
    const clean = key.trim().toLowerCase().replace(/[\s_-]+/g, '_')
    if (['student_name', 'fullname', 'full_name', 'student'].includes(clean)) return 'name'
    if (['student_email', 'mail'].includes(clean)) return 'email'
    if (['roll_no', 'roll_number', 'rollno', 'id', 'student_code'].includes(clean)) return 'student_id'
    if (['program', 'degree', 'department'].includes(clean)) return 'degree_program'
    if (['year', 'graduation_year'].includes(clean)) return 'batch'
    return clean
  }

  // Parse CSV File client side
  const processCSVFile = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      toast.error('Please select a valid .csv file')
      return
    }

    setFile(selectedFile)
    setUploadResult(null)
    setIsParsing(true)
    setParseErrors([])

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => normalizeKey(h),
      complete: (results) => {
        setIsParsing(false)
        if (results.errors && results.errors.length > 0) {
          const criticalErrors = results.errors.filter((e) => e.type !== 'FieldMismatch')
          if (criticalErrors.length > 0) {
            toast.error(`CSV Parsing error: ${criticalErrors[0].message}`)
          }
        }

        const rawRows = results.data || []
        if (rawRows.length === 0) {
          toast.error('The selected CSV file contains no data rows.')
          setParsedData([])
          return
        }

        // Validate each row
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const errors = []
        const validRows = rawRows.map((row, index) => {
          const rowNum = index + 2 // considering 1-based index and header
          const rowErrors = []

          const name = (row.name || '').trim()
          const email = (row.email || '').trim().toLowerCase()
          const studentId = (row.student_id || '').trim()
          const batch = (row.batch || '').trim()
          const degreeProgram = (row.degree_program || '').trim()
          const semester = (row.semester || '').trim()

          if (!name) rowErrors.push('Missing Name')
          if (!email) {
            rowErrors.push('Missing Email')
          } else if (!emailRegex.test(email)) {
            rowErrors.push('Invalid Email')
          }
          if (!studentId) rowErrors.push('Missing Student ID')

          if (rowErrors.length > 0) {
            errors.push({ row: rowNum, studentId: studentId || `Row ${rowNum}`, email, errors: rowErrors })
          }

          return {
            name,
            email,
            student_id: studentId,
            batch: batch || '',
            degree_program: degreeProgram || '',
            semester: semester || '',
            isValid: rowErrors.length === 0,
            rowErrors,
          }
        })

        setParsedData(validRows)
        setParseErrors(errors)

        const validCount = validRows.filter((r) => r.isValid).length
        if (errors.length > 0) {
          toast(`Parsed ${validRows.length} rows (${validCount} valid, ${errors.length} with issues)`, { icon: '⚠️' })
        } else {
          toast.success(`Successfully parsed all ${validRows.length} student records!`)
        }
      },
      error: (err) => {
        setIsParsing(false)
        console.error('[BulkUpload] PapaParse error:', err)
        toast.error(`Failed to read CSV: ${err.message}`)
      },
    })
  }

  // Handle Drag & Drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCSVFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processCSVFile(e.target.files[0])
    }
  }

  const resetSelection = () => {
    setFile(null)
    setParsedData([])
    setParseErrors([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Convert valid parsed rows back into standardized CSV text expected by backend parser
  const buildNormalizedCSVText = (rows) => {
    const headers = ['name', 'email', 'student_id', 'batch', 'degree_program', 'semester']
    const csvLines = [headers.join(',')]

    rows.forEach((r) => {
      const escape = (val) => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      csvLines.push(
        [
          escape(r.name),
          escape(r.email),
          escape(r.student_id),
          escape(r.batch),
          escape(r.degree_program),
          escape(r.semester),
        ].join(',')
      )
    })

    return csvLines.join('\n')
  }

  // Handle Submit Upload
  const handleUpload = async () => {
    if (!file || parsedData.length === 0) {
      toast.error('Please select and parse a CSV file first')
      return
    }

    const validRows = parsedData.filter((r) => r.isValid)
    if (validRows.length === 0) {
      toast.error('No valid records found in the CSV. Please correct the errors and re-upload.')
      return
    }

    try {
      setIsUploading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('You are not authenticated. Please log in again.')
        return
      }

      // 1. Create a bulk_uploads tracking record in Supabase
      let bulkUploadId = crypto.randomUUID()
      try {
        const { data: uploadLog, error: uploadErr } = await supabase
          .from('bulk_uploads')
          .insert({
            id: bulkUploadId,
            university_id: user.id,
            file_name: file.name,
            file_path: `bulk-uploads/${user.id}/${Date.now()}-${file.name}`,
            status: 'processing',
            total_records: validRows.length,
            successful_records: 0,
            failed_records: 0,
          })
          .select()
          .single()

        if (!uploadErr && uploadLog?.id) {
          bulkUploadId = uploadLog.id
        }
      } catch (logErr) {
        console.warn('[BulkUpload] Non-fatal: bulk_uploads log insertion error:', logErr)
      }

      // 2. Prepare normalized CSV text
      const normalizedCSVText = buildNormalizedCSVText(validRows)

      // 3. Post to backend endpoint /api/university/bulk-upload-students
      const isDev = !import.meta.env.PROD
      const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
      const endpoint = isDev
        ? '/api/university/bulk-upload-students'
        : backendUrl
        ? `${backendUrl}/api/university/bulk-upload-students`
        : '/api/university/bulk-upload-students'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          csvText: normalizedCSVText,
          universityId: user.id,
          bulkUploadId: bulkUploadId,
        }),
      })

      let resData = null
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        resData = await response.json()
      } else {
        const text = await response.text()
        console.error('[BulkUpload] Non-JSON response:', text)
        throw new Error(`Server returned status ${response.status}: ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(resData?.error || resData?.message || `Bulk upload failed (${response.status})`)
      }

      // Successful backend response
      const results = resData.results || {
        successful: validRows.length,
        failed: 0,
        total: validRows.length,
        errors: null,
      }

      setUploadResult({
        success: true,
        successfulCount: results.successful,
        failedCount: results.failed,
        totalCount: results.total,
        errors: results.errors || [],
      })

      if (results.successful > 0) {
        toast.success(`Successfully uploaded and created accounts for ${results.successful} student(s)!`)
      }
      if (results.failed > 0) {
        toast(`${results.failed} student record(s) could not be processed.`, { icon: '⚠️' })
      }

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['university-students'] })
      queryClient.invalidateQueries({ queryKey: ['university-students-list'] })
      queryClient.invalidateQueries({ queryKey: ['university-bulk-uploads'] })
      refetchHistory()
    } catch (err) {
      console.error('[BulkUpload] Upload error:', err)
      toast.error(err.message || 'Failed to process bulk upload')
      setUploadResult({
        success: false,
        message: err.message || 'Bulk upload failed',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const validCount = parsedData.filter((r) => r.isValid).length
  const invalidCount = parsedData.length - validCount

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Users className="w-3.5 h-3.5 mr-1" />
              Student Registration
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Student Upload</h1>
          <p className="text-gray-600 text-sm mt-1">
            Register multiple students simultaneously by importing a formatted CSV document.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download Sample Template
        </button>
      </div>

      {/* Upload Zone & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Select CSV File
            </h2>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    isDragging ? 'bg-blue-100 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-blue-600 hover:underline">Click to browse</span> or drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Accepts standard .csv files with student credentials</p>
                </div>
              </div>
            </div>

            {/* Selected File Details */}
            {file && (
              <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    CSV
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-md">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • Ready for processing</p>
                  </div>
                </div>

                <button
                  onClick={resetSelection}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Result Alert */}
          {uploadResult && (
            <div
              className={`p-6 rounded-xl border ${
                uploadResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {uploadResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-base">
                    {uploadResult.success ? 'Bulk Upload Completed' : 'Bulk Upload Failed'}
                  </h3>
                  {uploadResult.success ? (
                    <div className="mt-2 space-y-2 text-sm">
                      <p>
                        Processed <strong>{uploadResult.totalCount}</strong> total records:{' '}
                        <span className="text-emerald-700 font-semibold">{uploadResult.successfulCount} created successfully</span>
                        {uploadResult.failedCount > 0 && (
                          <span className="text-amber-700 font-semibold">, {uploadResult.failedCount} failed</span>
                        )}
                        .
                      </p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200">
                          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">
                            Failed Record Details:
                          </p>
                          <ul className="space-y-1 text-xs text-rose-700 list-disc list-inside">
                            {uploadResult.errors.map((err, i) => (
                              <li key={i}>
                                <strong>{err.data?.name || err.data?.email || `Row ${i + 1}`}</strong>: {err.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm mt-1">{uploadResult.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Parsed Records Preview</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Review your student records before finalizing account creation
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">
                      {invalidCount} Issues
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Status</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Student Name</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Email Address</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Student ID / Roll No</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Program</th>
                      <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-gray-50' : 'bg-rose-50/40 hover:bg-rose-50/70'}>
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-emerald-700 font-medium gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Valid
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-rose-700 font-medium gap-1"
                              title={row.rowErrors.join(', ')}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              {row.rowErrors[0]}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{row.name || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.email || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">{row.student_id || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.degree_program || '—'}</td>
                        <td className="py-2.5 px-3 text-gray-600">{row.batch || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {validCount === parsedData.length
                    ? 'All rows are valid and ready to submit.'
                    : `Note: ${invalidCount} invalid row(s) will be excluded or may fail during creation.`}
                </p>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={resetSelection}
                    disabled={isUploading}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpload}
                    disabled={isUploading || validCount === 0}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Student Accounts...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Confirm & Register {validCount} Students</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions & Upload History Side Column */}
        <div className="space-y-6">
          {/* Instructions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              CSV Format Requirements
            </h3>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>Your CSV document must include the following column headers in the first row:</p>

              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-[11px]">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600 shrink-0">name</span>: Student full name (required)
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600 shrink-0">email</span>: University email (required)
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-blue-600 shrink-0">student_id</span>: Roll / ID number (required)
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-500 shrink-0">batch</span>: Admission year (e.g. 2024)
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-500 shrink-0">degree_program</span>: Degree name
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-semibold text-gray-500 shrink-0">semester</span>: Current semester
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Unique credentials and temporary passwords will be automatically provisioned for each student.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Students can login immediately using their email and student ID number.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-b from-indigo-50 via-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 text-gray-700">
            <h4 className="font-bold text-sm text-indigo-900 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              Need Help with Format?
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Download our sample spreadsheet template using the button above to avoid header formatting errors.
            </p>
          </div>
        </div>
      </div>

      {/* Upload History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Upload History</h2>
            <p className="text-xs text-gray-500 mt-0.5">Logs of recent bulk student registration files</p>
          </div>
          <button
            onClick={() => refetchHistory()}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : uploadHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No previous bulk uploads found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left py-2.5 px-3 font-semibold">File Name</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Date Uploaded</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Status</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Total Records</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Successful</th>
                  <th className="text-left py-2.5 px-3 font-semibold">Failed</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {uploadHistory.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50/60">
                      <td className="py-3 px-3 font-medium text-gray-900">{item.file_name}</td>
                      <td className="py-3 px-3 text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {item.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            Completed
                          </span>
                        ) : item.status === 'processing' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                            Processing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-700">{item.total_records ?? 0}</td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">{item.successful_records ?? 0}</td>
                      <td className="py-3 px-3 text-rose-600 font-semibold">{item.failed_records ?? 0}</td>
                      <td className="py-3 px-3 text-right">
                        {item.error_log ? (
                          <button
                            onClick={() => setExpandedLogId(expandedLogId === item.id ? null : item.id)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                          >
                            {expandedLogId === item.id ? (
                              <>
                                Hide Log <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                View Log <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {expandedLogId === item.id && item.error_log && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-4 text-xs">
                          <div className="bg-white border border-gray-200 rounded p-3 text-gray-700 overflow-x-auto max-h-48 font-mono">
                            <pre>{JSON.stringify(item.error_log, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
