import { z } from 'zod';

/**
 * Authorized Theme Contexts in Synthesis / Táta má právo architecture.
 */
export const THEME_CONTEXTS = ['GLOBAL', 'PUBLIC', 'PRIVATE', 'ADMIN'] as const;
export type ThemeContextType = typeof THEME_CONTEXTS[number];

/**
 * 14 standard theme color keys authorized in the current Theme Engine.
 */
export const ALLOWED_THEME_VARIABLE_KEYS = [
  'primary',
  'secondary',
  'background',
  'surface',
  'text',
  'textMuted',
  'heading',
  'link',
  'border',
  'button',
  'buttonHover',
  'success',
  'warning',
  'error',
] as const;
export type AllowedThemeVariableKey = typeof ALLOWED_THEME_VARIABLE_KEYS[number];

/**
 * Strict HEX color format: #RGB, #RRGGBB or #RRGGBBAA.
 * Explicitly rejects arbitrary CSS expressions, url(...), semicolons, javascript URLs, etc.
 */
export const SAFE_HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Safe theme slug regex: [a-z0-9_-], length 2-64.
 */
export const THEME_KEY_REGEX = /^[a-z0-9_-]{2,64}$/;

export const ThemeKeySchema = z
  .string()
  .trim()
  .min(2, 'Klíč tématu musí mít minimálně 2 znaky')
  .max(64, 'Klíč tématu smí mít maximálně 64 znaků')
  .regex(
    THEME_KEY_REGEX,
    'Klíč tématu smí obsahovat pouze malá písmena bez diakritiky, číslice, pomlčky a podtržítka ([a-z0-9_-])'
  );

export const ThemeNameSchema = z
  .string()
  .trim()
  .min(1, 'Název tématu nesmí být prázdný')
  .max(100, 'Název tématu smí mít maximálně 100 znaků')
  .refine((val) => !/[<>]/.test(val), 'Název tématu nesmí obsahovat HTML značky');

export const ThemeDescriptionSchema = z
  .string()
  .trim()
  .max(500, 'Popis tématu smí mít maximálně 500 znaků')
  .refine((val) => !/[<>]/.test(val), 'Popis tématu nesmí obsahovat HTML značky')
  .optional();

export const ThemeContextSchema = z.enum(['GLOBAL', 'PUBLIC', 'PRIVATE', 'ADMIN']);

export const ThemeColorValueSchema = z
  .string()
  .trim()
  .regex(
    SAFE_HEX_COLOR_REGEX,
    'Hodnota barvy musí být validní HEX kód (např. #1e3a8a nebo #fff). Libovolné CSS výrazy, url(...) a kód jsou zakázány.'
  );

export const ThemeVariablesMapSchema = z
  .record(z.string(), z.string())
  .superRefine((data, ctx) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mapa proměnných nesmí být prázdná',
      });
      return;
    }

    for (const key of keys) {
      if (!ALLOWED_THEME_VARIABLE_KEYS.includes(key as any)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Nepovolený klíč proměnné tématu: '${key}'. Povolené klíče: ${ALLOWED_THEME_VARIABLE_KEYS.join(', ')}`,
          path: [key],
        });
      }

      const val = data[key];
      const parsedColor = ThemeColorValueSchema.safeParse(val);
      if (!parsedColor.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Neplatná hodnota pro proměnnou '${key}': '${val}'. Očekáván validní HEX formát (#RRGGBB).`,
          path: [key],
        });
      }
    }
  });

export const CreateThemeSchema = z.object({
  key: ThemeKeySchema,
  name: ThemeNameSchema,
  description: ThemeDescriptionSchema,
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
  context: ThemeContextSchema.default('GLOBAL'),
  variables: z
    .record(z.string(), z.string())
    .superRefine((data, ctx) => {
      const keys = Object.keys(data);
      for (const key of keys) {
        if (!ALLOWED_THEME_VARIABLE_KEYS.includes(key as any)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Nepovolený klíč proměnné tématu: '${key}'. Povolené klíče: ${ALLOWED_THEME_VARIABLE_KEYS.join(', ')}`,
            path: [key],
          });
        }
        const val = data[key];
        const parsedColor = ThemeColorValueSchema.safeParse(val);
        if (!parsedColor.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Neplatná hodnota pro proměnnou '${key}': '${val}'. Očekáván validní HEX formát (#RRGGBB).`,
            path: [key],
          });
        }
      }
    })
    .optional(),
});

export const UpdateThemeVariablesSchema = ThemeVariablesMapSchema;

export const UpdateThemeSingleColorSchema = z.object({
  key: z.enum([
    'primary',
    'secondary',
    'background',
    'surface',
    'text',
    'textMuted',
    'heading',
    'link',
    'border',
    'button',
    'buttonHover',
    'success',
    'warning',
    'error',
  ]),
  value: ThemeColorValueSchema,
});
