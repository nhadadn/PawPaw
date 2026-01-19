import { z } from 'zod';

export const ReserveSchema = z.object({
  items: z.array(
    z.object({
      product_variant_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "El carrito no puede estar vacío"),
});

export const PaymentSchema = z.object({
  reservation_id: z.string().uuid(),
  payment_intent_id: z.string().startsWith("pi_"),
});

export const AddressSchema = z.object({
  street: z.string().min(5, "La calle es requerida"),
  city: z.string().min(2, "La ciudad es requerida"),
  zip: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  state: z.string().optional(),
  country: z.string().default("MX"),
});

export type ReserveInput = z.infer<typeof ReserveSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
