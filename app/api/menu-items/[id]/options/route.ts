import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/helpers'

const paramsSchema = z.object({
  id: z.uuid(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = paramsSchema.safeParse({ id })
  if (!parsed.success) {
    return apiError('Invalid menu item id', 400)
  }

  const supabase = await createClient()

  // Verify menu item exists
  const { data: menuItem } = await supabase
    .from('menu_items')
    .select('id')
    .eq('id', id)
    .single()

  if (!menuItem) {
    return apiError('Menu item not found', 404)
  }

  // Fetch option groups ordered by sort_order
  const { data: groups, error: groupsError } = await supabase
    .from('menu_item_option_groups')
    .select('id, menu_item_id, name, selection_type, is_required, sort_order')
    .eq('menu_item_id', id)
    .order('sort_order')

  if (groupsError) {
    return apiError('Failed to fetch option groups', 500)
  }

  if (!groups || groups.length === 0) {
    return apiSuccess({ groups: [] })
  }

  // Fetch all options for these groups ordered by sort_order
  const groupIds = groups.map((g) => g.id)
  const { data: options, error: optionsError } = await supabase
    .from('menu_item_options')
    .select('id, option_group_id, name, additional_price_cents, is_default, sort_order')
    .in('option_group_id', groupIds)
    .order('sort_order')

  if (optionsError) {
    return apiError('Failed to fetch options', 500)
  }

  // Nest options into their groups (immutable construction)
  const optionsByGroupId = (options ?? []).reduce<Record<string, typeof options>>((acc, opt) => {
    const existing = acc[opt.option_group_id] ?? []
    return { ...acc, [opt.option_group_id]: [...existing, opt] }
  }, {})

  const groupsWithOptions = groups.map((group) => ({
    ...group,
    options: optionsByGroupId[group.id] ?? [],
  }))

  return apiSuccess({ groups: groupsWithOptions })
}
