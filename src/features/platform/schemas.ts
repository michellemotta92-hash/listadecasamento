import { z } from 'zod';

export const createSiteSchema = z.object({
  couple_name: z
    .string()
    .min(2, 'Nome do casal é obrigatório')
    .max(120, 'Máximo 120 caracteres'),
  slug: z
    .string()
    .min(2, 'Endereço muito curto')
    .max(64)
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      'Use apenas letras minúsculas, números e hífens'
    ),
  event_date: z.string().optional(),
});

export type CreateSiteForm = z.infer<typeof createSiteSchema>;
