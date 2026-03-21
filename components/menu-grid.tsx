'use client'

import { useState } from 'react'
import { MenuItemCard } from '@/components/menu-item-card'
import { MenuItemDetailModal } from '@/components/menu-item-detail-modal'
import type { MenuItem } from '@/lib/types/database'

type MenuGridItem = Pick<
  MenuItem,
  'id' | 'name' | 'original_price_cents' | 'market_price_cents' | 'image_url'
>

interface Props {
  items: MenuGridItem[]
}

export function MenuGrid({ items }: Props) {
  const [selectedItem, setSelectedItem] = useState<MenuGridItem | null>(null)

  return (
    <>
      <div
        data-testid="menu-grid"
        className="grid grid-cols-2 gap-3 pb-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="text-left"
            onClick={() => setSelectedItem(item)}
          >
            <MenuItemCard
              name={item.name}
              originalPriceCents={item.original_price_cents}
              marketPriceCents={item.market_price_cents}
              imageUrl={item.image_url}
            />
          </button>
        ))}
      </div>

      <MenuItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  )
}
