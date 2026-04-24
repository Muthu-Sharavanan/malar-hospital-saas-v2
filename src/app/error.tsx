'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A4D68]/5 text-center p-8">
      <div className="glass-card max-w-md">
        <div className="text-4xl text-[#ef4444] mb-4">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="text-2xl font-bold text-[#0A4D68] mb-2">Something went wrong!</h2>
        <p className="text-[#64748b] mb-6">{error.message || "An unexpected error occurred in the hospital system."}</p>
        <div className="flex gap-4 justify-center">
          <button
            className="btn btn-outline"
            onClick={() => window.location.href = '/dashboard/reception'}
          >
            Go Home
          </button>
          <button
            className="btn btn-primary"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
