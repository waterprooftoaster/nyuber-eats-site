import { CheckCircle2 } from 'lucide-react'

export function OrderCompletionNotice() {
  return (
    <div className="flex items-center gap-3 border-t border-green-200 bg-green-50 px-4 py-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
      <p className="text-sm font-medium text-green-800">
        Your order is complete! Check the delivery photo above.
      </p>
    </div>
  )
}
