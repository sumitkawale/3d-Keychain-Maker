import { PI } from '../constants.js';

export const VIEWER_CLAMP = { min: 15, max: 600 };

export const ORBIT_DEFAULTS = {
  th: -PI / 2,
  ph: 0.7,
  rad: 90,
  firstFit: true,
};

export const CAMERA_DEFAULTS = {
  fov: 40,
  near: 0.1,
  far: 3000,
};

export const FIRST_FIT_ZOOM_FACTOR = 4.4;
export const FIRST_FIT_ZOOM_OFFSET = 20;
