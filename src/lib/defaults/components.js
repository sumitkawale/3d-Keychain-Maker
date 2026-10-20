import { DEFAULT_FONT } from './typography.js';

export const COMPONENT_ID_START = 2;

export const COMPONENT_DEFAULTS = {
  size: 12,
  height: 1.2,
  color: '#ffffff',
  recolor: false,
  pos: 'tl',
  rot: 0,
  pt: 0,
  pb: 0,
  pl: 0,
  pr: 0,
  sp: 0.3,
};

export const BORDER_COMPONENT_SIZE = {
  text: 6,
  icon: 8,
};

export const GROUP_DEFAULTS = {
  type: 'group',
  dir: 'v',
  gap: 1.5,
  kids: [],
};

export const INITIAL_TEXT_COMPONENT = {
  id: 1,
  type: 'text',
  text: 'Your Name',
  font: DEFAULT_FONT,
  size: COMPONENT_DEFAULTS.size,
  height: COMPONENT_DEFAULTS.height,
  color: COMPONENT_DEFAULTS.color,
};

export const DEFAULT_COMPONENTS = [INITIAL_TEXT_COMPONENT];

export const NEW_TEXT_PRESET = {
  type: 'text',
  text: 'Text',
  font: DEFAULT_FONT,
  size: COMPONENT_DEFAULTS.size,
};

export const CLEAR_TEXT_PRESET = {
  type: 'text',
  text: 'Your Name',
  font: DEFAULT_FONT,
  size: COMPONENT_DEFAULTS.size,
  height: COMPONENT_DEFAULTS.height,
  color: COMPONENT_DEFAULTS.color,
};
