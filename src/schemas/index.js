import { z } from 'zod';

// ─── Hero Schema ────────────────────────────────────────────────────────────────

/** @type {z.ZodType} Validates hero stat records from patch data */
export const HeroSchema = z.object({
  id: z.number({ error: 'Hero ID must be a number' }),
  name: z.string().min(1, 'Hero name is required'),
  role: z.string().min(1, 'Hero role is required'),
  win_rate: z.number().min(0).max(100),
  pick_rate: z.number().min(0).max(100),
  ban_rate: z.number().min(0).max(100),
  lane: z.string().optional(),
});

// ─── Item Schema ────────────────────────────────────────────────────────────────

/** @type {z.ZodType} Validates in-game equipment item records */
export const ItemSchema = z.object({
  id: z.number({ error: 'Item ID must be a number' }),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Item category is required'),
  stats: z.string(),
  passive: z.string(),
  icon: z.string(),
});

// ─── Spell Schema ───────────────────────────────────────────────────────────────

/** @type {z.ZodType} Validates battle spell records */
export const SpellSchema = z.object({
  name: z.string().min(1, 'Spell name is required'),
  des: z.string(),
  icon: z.string(),
});

// ─── Emblem Schema ──────────────────────────────────────────────────────────────

/** @type {z.ZodType} Schema for a single emblem talent entry */
export const TalentSchema = z.object({
  tier: z.number(),
  name: z.string().min(1, 'Talent name is required'),
  des: z.string(),
  icon: z.string(),
});

/** @type {z.ZodType} Validates emblem configuration records */
export const EmblemSchema = z.object({
  name: z.string().min(1, 'Emblem name is required'),
  icon: z.string(),
  color: z.string(),
  talents: z.array(TalentSchema),
});

// ─── Patch Manifest Schema ──────────────────────────────────────────────────────

/** @type {z.ZodType} Schema for a single downloadable asset entry in a patch */
export const PatchAssetSchema = z.object({
  url: z.string(),
  localPath: z.string(),
  hash: z.string().optional(),
});

/** @type {z.ZodType} Validates the top-level patch manifest used for OTA updates */
export const PatchManifestSchema = z.object({
  patch: z.string().min(1, 'Patch version is required'),
  signature: z.string().optional(),
  assets: z.array(PatchAssetSchema),
});

// ─── Batch Validators ───────────────────────────────────────────────────────────

/** @type {z.ZodType} Validates an array of hero records */
export const HeroBatchSchema = z.array(HeroSchema);

/** @type {z.ZodType} Validates an array of item records */
export const ItemBatchSchema = z.array(ItemSchema);

/** @type {z.ZodType} Validates an array of spell records */
export const SpellBatchSchema = z.array(SpellSchema);

/** @type {z.ZodType} Validates an array of emblem records */
export const EmblemBatchSchema = z.array(EmblemSchema);
