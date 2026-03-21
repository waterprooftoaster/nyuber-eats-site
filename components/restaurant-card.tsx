import Image from 'next/image'
import { cn } from '@/lib/utils'

interface RestaurantCardProps {
  name: string
  image_url?: string | null
}

export function RestaurantCard({ name, image_url }: RestaurantCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'group flex w-full cursor-pointer flex-col text-left',
        'transition-all duration-200 ease-in-out',
        'hover:scale-[1.02]',
      )}
    >
      {/* Restaurant image */}
      <div
        className={cn(
          'relative w-full rounded-xl bg-gray-200',
          'aspect-[16/10] overflow-hidden',
          'transition-shadow duration-200 group-hover:shadow-md',
        )}
      >
        {image_url && (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 25vw, 200px"
          />
        )}
      </div>
      {/* Restaurant name */}
      <p className="mt-2 truncate px-0.5 text-sm font-semibold text-gray-900">
        {name}
      </p>
    </button>
  )
}
