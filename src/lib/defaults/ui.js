import { LAYOUT_DEFAULTS } from './layout.js';
import { BASE_DEFAULTS } from './base.js';
import { BORDER_DEFAULTS } from './border.js';
import { KEYRING_DEFAULTS } from './keyring.js';
import { EXPORT_DEFAULTS } from './export.js';
import { numericUiDefault } from './numeric.js';

/** Merged panel settings (all `<select>`, checkboxes, and numeric inputs in the sidebar). */
export const DEFAULT_UI = {
  ...LAYOUT_DEFAULTS,
  ...BASE_DEFAULTS,
  ...BORDER_DEFAULTS,
  ...KEYRING_DEFAULTS,
  ...EXPORT_DEFAULTS,
  hole: numericUiDefault('hole'),
  osz: numericUiDefault('osz'),
};
