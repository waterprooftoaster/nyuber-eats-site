import { cn } from '@/lib/utils'

interface RestaurantCardProps {
  name: string
}

export function RestaurantCard({ name }: RestaurantCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex w-full cursor-pointer flex-col text-left',
        'transition-all duration-200 ease-in-out',
        'hover:scale-[1.02]',
      )}
    >
      {/* Placeholder image — 16:10 aspect ratio */}
      <div
        className={cn(
          'w-full rounded-xl bg-gray-200',
          'aspect-[16/10] overflow-hidden',
          'transition-shadow duration-200 group-hover:shadow-md',
        )}
      />
      {/* Restaurant name */}
      <p className="mt-2 truncate px-0.5 text-sm font-semibold text-gray-900">
        {name}
      </p>
    </button>
  )
}
