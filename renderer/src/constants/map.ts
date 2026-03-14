export const MAP_INITIAL_BEARING = -20
export const MAP_INITIAL_CAMERA_HEIGHT_M = 18000
export const RANDOM_MARKER_ALTITUDE_MIN_M = 150
export const RANDOM_MARKER_ALTITUDE_MAX_M = 1800

export const MAIN_MARKER_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">' +
      '<path fill="#e53935" d="M12 0C6.7 0 2.4 4.3 2.4 9.6c0 7.2 9.6 21.6 9.6 21.6s9.6-14.4 9.6-21.6C21.6 4.3 17.3 0 12 0z"/>' +
      '<circle cx="12" cy="10" r="4.2" fill="#ffffff"/>' +
      '</svg>'
  )
