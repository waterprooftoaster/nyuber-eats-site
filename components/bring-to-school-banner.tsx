import { cn } from '@/lib/utils'
import { CONTACT_EMAIL } from '@/lib/constants'

export function BringToSchoolBanner() {
  return (
    <div className="col-span-1 sm:col-span-2">
      <div
        className={cn(
          'flex w-full flex-col rounded-xl',
          'border border-gray-200 bg-white',
          'p-6 transition-all duration-200 ease-in-out',
          'hover:scale-[1.02] hover:shadow-md',
        )}
      >
        <h3 className="text-lg font-bold text-gray-900">
          Bring Goober Eats to Your School
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          We&apos;re just getting started! Want Goober Eats at your campus?
          Reach out and let us know.
        </p>
        <div className="mt-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm font-medium text-gray-900 underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  )
}
