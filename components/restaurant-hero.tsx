import Image from 'next/image'

interface RestaurantHeroProps {
  imageUrl: string | null
  alt: string
}

export function RestaurantHero({ imageUrl, alt }: RestaurantHeroProps) {
  return (
    <div className="relative aspect-[16/6] w-full overflow-hidden rounded-xl bg-gray-200">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      )}
    </div>
  )
}
