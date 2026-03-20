import { z } from 'zod'

export const createOrderSchema = z.object({
  eatery_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  special_instructions: z.string().max(500).optional(),
  tip_cents: z.number().int().min(0).max(10000).optional(),
  guest_name: z.string().min(1).max(100).optional(),
  guest_phone: z.string().regex(/^\+?[0-9\s\-().]{7,20}$/).optional(),
  guest_stripe_pm_id: z.string().regex(/^pm_[a-zA-Z0-9]+$/).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'accepted',
    'in_progress',
    'completed',
    'paid',
    'cancelled',
  ]),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const createCheckoutSchema = z.object({
  order_id: z.string().uuid(),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

export const sendMessageSchema = z.object({
  order_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
