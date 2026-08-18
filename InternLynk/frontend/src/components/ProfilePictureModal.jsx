import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getProfilePictureUrl, uploadProfilePicture } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Camera,
  Upload,
  Trash2,
  X,
  Check,
  RotateCw,
  Sparkles,
  RefreshCcw,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react'

export default function ProfilePictureModal({
  isOpen,
  onClose,
  profilePicture,
  userName,
  userEmail,
  userRole,
}) {
  const { user, profile, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('view') // 'view' | 'upload' | 'camera'
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const currentPictureUrl = profile?.profile_picture
    ? getProfilePictureUrl(profile.profile_picture)
    : profilePicture
    ? getProfilePictureUrl(profilePicture)
    : null

  const initial =
    userName?.[0]?.toUpperCase() ||
    userEmail?.[0]?.toUpperCase() ||
    profile?.full_name?.[0]?.toUpperCase() ||
    'U'

  const displayRole = userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ')
    : profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace('_', ' ')
    : 'User'

  // Clean up camera stream and object URLs when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(null)
      setPreviewUrl(null)
      setActiveTab('view')
      setCameraError(null)
    }
  }, [isOpen])

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null)
      stopCamera()
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsCameraActive(true)
      setActiveTab('camera')
    } catch (err) {
      console.error('[ProfilePictureModal] Camera access error:', err)
      setCameraError('Camera access was denied or is not available on this device.')
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to capture image')
        return
      }
      const file = new File([blob], `camera-snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(blob)
      setPreviewUrl(objectUrl)
      stopCamera()
      setActiveTab('upload')
    }, 'image/jpeg', 0.92)
  }

  // Handle Gallery / File input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setActiveTab('upload')
  }

  // Upload and Save Profile Picture
  const handleSavePicture = async () => {
    if (!selectedFile || !user?.id) {
      toast.error('Please select an image to upload')
      return
    }

    try {
      setIsUploading(true)
      const res = await uploadProfilePicture(selectedFile, user.id)

      if (res.success && res.filePath) {
        // Refresh AuthContext profile
        await updateProfile({ profile_picture: res.filePath })
        toast.success('Profile picture updated successfully!')
        setSelectedFile(null)
        setPreviewUrl(null)
        setActiveTab('view')
        onClose()
      } else {
        throw new Error(res.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('[ProfilePictureModal] Upload error:', err)
      toast.error(err.message || 'Failed to save profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  // Remove Profile Picture
  const handleRemovePicture = async () => {
    if (!user?.id) return
    try {
      setIsUploading(true)
      const { error } = await updateProfile({ profile_picture: null })
      if (error) throw error
      toast.success('Profile picture removed')
      setSelectedFile(null)
      setPreviewUrl(null)
      setActiveTab('view')
    } catch (err) {
      console.error('[ProfilePictureModal] Remove error:', err)
      toast.error('Failed to remove profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  const overlay = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={() => {
        stopCamera()
        onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" />

      {/* Hidden canvas for snapshotting */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Modal Dialog */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                {userName || profile?.full_name || profile?.organization_name || 'Profile Picture'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {displayRole}
                </span>
                <span>•</span>
                <span className="truncate">{userEmail || profile?.email || user?.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* CAMERA MODE */}
          {activeTab === 'camera' ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-white/80 shadow-2xl pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera()
                    setActiveTab('view')
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:from-blue-700 hover:to-indigo-700 transition transform active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            /* PREVIEW / EDIT MODE */
            <div className="space-y-5 text-center">
              <div className="relative inline-block mx-auto">
                <img
                  src={previewUrl}
                  alt="New Preview"
                  className="w-44 h-44 rounded-full object-cover border-4 border-white shadow-xl mx-auto ring-4 ring-blue-100"
                />
                <span className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">Preview New Picture</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click save to apply this photo as your account avatar across all portals.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                    setActiveTab('view')
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50/50 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                >
                  Choose Different
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleSavePicture}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Photo
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-6 text-center">
              <div className="relative inline-block mx-auto">
                {currentPictureUrl ? (
                  <img
                    src={currentPictureUrl}
                    alt={userName || 'Avatar'}
                    className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl mx-auto ring-4 ring-blue-100"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-5xl font-black shadow-xl mx-auto border-4 border-white ring-4 ring-blue-100">
                    {initial}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {currentPictureUrl ? 'Current Profile Picture' : 'No Profile Picture Set'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Upload a photo from your device or take a live picture using your camera.
                </p>
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl text-left">
                  {cameraError}
                </div>
              )}

              {/* Action Buttons: Gallery & Camera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload from Gallery / Device</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo with Camera</span>
                </button>
              </div>

              {/* Remove Picture Button if user already has one */}
              {currentPictureUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleRemovePicture}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove current photo</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
