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

// Only statuses a client can supply — 'accepted' is set by the accept endpoint,
// 'paid' by the Stripe webhook; 'pending' is the initial state only.
export const updateOrderStatusSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'cancelled']),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const createCheckoutSchema = z.object({
  order_id: z.string().uuid(),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>

export const sendMessageSchema = z.object({
  order_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
  // delivery_photo messages are created via a separate upload endpoint (session 3)
  message_type: z.enum(['text', 'system']).default('text'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const addCartItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  selected_options: z.array(z.string().uuid()).max(50).default([]),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>

export const updateProfileSchema = z
  .object({
    school_id: z.string().uuid().optional(),
    is_swiper: z.boolean().optional(),
  })
  .refine((d) => d.school_id !== undefined || d.is_swiper !== undefined, {
    message: 'At least one field must be provided',
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
