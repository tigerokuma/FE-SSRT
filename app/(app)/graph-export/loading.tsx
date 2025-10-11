// (dashboard)/graph/loading.tsx (or wherever your route is)
import { Loader2 } from "lucide-react"

export default function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
    </div>
  );
}