import { z } from 'zod';

const rateSchema = z.object({
  single: z.number().min(0, 'Single rate must be a non-negative number'),
  double: z.number().min(0, 'Double rate must be a non-negative number'),
});

const sizePricingSchema = z.object({
  BLACK_WHITE: rateSchema.optional(),
  COLOR: rateSchema.optional(),
});

export const updateShopProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Shop name must be at least 2 characters').max(100).optional(),
    contactNumber: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        landmark: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateShopPricingSchema = z.object({
  body: z.object({
    A4: sizePricingSchema.optional(),
    A3: sizePricingSchema.optional(),
  }),
});

export const toggleShopStatusSchema = z.object({
  body: z.object({
    isOpen: z.boolean({ required_error: 'isOpen boolean is required' }),
  }),
});
