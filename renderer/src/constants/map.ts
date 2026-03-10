const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY?.trim() || ''

export const HAS_MAPTILER_KEY = MAPTILER_KEY.length > 0

export const MAP_STYLE_URL = HAS_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
  : ''

export const TERRAIN_DEM_URL = HAS_MAPTILER_KEY
  ? `https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=${MAPTILER_KEY}`
  : ''

export const MAP_MIN_ZOOM = 2
export const MAP_MAX_ZOOM = 18
export const MAP_INITIAL_ZOOM = 14
export const MAP_INITIAL_PITCH = 55
export const MAP_INITIAL_BEARING = -20
export const TERRAIN_EXAGGERATION = 1.3

export const MAIN_MARKER_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">' +
      '<path fill="#e53935" d="M12 0C6.7 0 2.4 4.3 2.4 9.6c0 7.2 9.6 21.6 9.6 21.6s9.6-14.4 9.6-21.6C21.6 4.3 17.3 0 12 0z"/>' +
      '<circle cx="12" cy="10" r="4.2" fill="#ffffff"/>' +
      '</svg>'
  )
