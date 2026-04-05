import { useEffect, useRef, useState } from 'react'

export default function CameraCapture({
  onCapture,
  title = 'Camera Capture',
  buttonLabel = 'Capture',
  disabled = false,
  previewImage = '',
  compact = false,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setError('Camera access is not supported in this browser.')
        }
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setError('')
        setReady(true)
      } catch (cameraError) {
        if (!cancelled) {
          setError('Camera access was blocked. You can still upload an image below.')
          setReady(false)
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError('The camera is not ready yet. Please wait a moment and try again.')
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL('image/jpeg', 0.9)
    onCapture(imageData)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {ready && <span className="text-xs text-green-600 font-medium">Camera Ready</span>}
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <div className="space-y-3">
          <div className="bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full object-cover ${compact ? 'h-48' : 'h-64'}`}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={captureFrame}
              disabled={disabled}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {buttonLabel}
            </button>

            <label className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={disabled}
              />
            </label>
          </div>

          {error && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-dashed border-gray-300 rounded-xl min-h-48 flex items-center justify-center overflow-hidden">
            {previewImage ? (
              <img src={previewImage} alt="Captured preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-sm text-gray-500 px-4 text-center">
                Capture or upload an image to preview it here before saving.
              </p>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  )
}
