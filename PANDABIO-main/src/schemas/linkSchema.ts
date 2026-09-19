import { z } from 'zod';

/**
 * Esquemas de validação para formulários do PandaBio
 * Usa Zod para validação robusta e type-safe
 */

const linkTypeEnum = z.enum(['social', 'whatsapp', 'portfolio', 'store', 'custom']);

export const linkSchema = z.object({
  title: z
    .string()
    .min(3, 'Título deve ter no mínimo 3 caracteres')
    .max(50, 'Título deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9\sà-úÀ-Ú\-_]+$/, 'Título contém caracteres inválidos'),
  url: z
    .string()
    .min(1, 'URL é obrigatória')
    .refine(
      (val) => {
        try {
          new URL(val.startsWith('http') ? val : `https://${val}`);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'URL inválida' }
    ),
  type: linkTypeEnum,
});

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  price: z
    .number()
    .positive('Preço deve ser positivo')
    .max(999999, 'Preço muito alto'),
});

export const userSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),
  email: z.string().email('E-mail inválido'),
  bioDescription: z
    .string()
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .optional(),
});

export type LinkFormData = z.infer<typeof linkSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type LinkType = z.infer<typeof linkTypeEnum>;