import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="space-y-2 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist or may have been moved. Check the address or return to the homepage to
          keep exploring events.
        </p>
      </div>
      <Button asChild size="lg">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
