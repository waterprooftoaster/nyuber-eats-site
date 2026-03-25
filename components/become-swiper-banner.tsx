import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface BecomeSwiperBannerProps {
  ctaHref: string
}

export function BecomeSwiperBanner({ ctaHref }: BecomeSwiperBannerProps) {
  return (
    <div className="col-span-1 sm:col-span-2">
      <div
        className={cn(
          'flex w-full flex-col rounded-xl',
          'bg-gradient-to-br from-gray-900 to-gray-700',
          'p-6 text-white transition-all duration-200 ease-in-out',
          'hover:scale-[1.02] hover:shadow-md',
        )}
      >
        <h3 className="text-lg font-bold">Got Meal Swipes? Earn Cash.</h3>
        <p className="mt-2 text-sm text-gray-300">
          Expiring meal swipes sitting on your plan? Become a swiper and turn
          them into money.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline" size="lg">
            <Link href={ctaHref}>Start Swiping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
