import type { OrderStatus } from '@/lib/types/database'

const CLOSED_STATUSES = ['completed', 'paid', 'cancelled']

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

interface Props {
  status: string
}

export function ChatBanner({ status }: Props) {
  const isClosed = CLOSED_STATUSES.includes(status)
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2">
      <span className="text-xs font-medium text-gray-500">Order status:</span>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
        {STATUS_LABELS[status as OrderStatus] ?? status}
      </span>
      {isClosed && (
        <span className="ml-auto text-xs italic text-gray-400">
          This conversation is closed
        </span>
      )}
    </div>
  )
}
