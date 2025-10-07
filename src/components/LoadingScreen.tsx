import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3" role="status" aria-live="polite">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">Loading content…</p>
    </div>
  )
}

export default LoadingScreen
