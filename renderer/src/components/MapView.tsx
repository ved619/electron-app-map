import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import {
  HAS_MAPTILER_KEY,
  MAP_INITIAL_BEARING,
  MAP_INITIAL_PITCH,
  MAIN_MARKER_SVG,
  MAP_INITIAL_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE_URL,
  TERRAIN_DEM_URL,
  TERRAIN_EXAGGERATION
} from '../constants/map'
import type { Coordinates, MapBounds, MarkerData } from '../types/map'

type MapViewProps = {
  latitude: number
  longitude: number
  onMarkerDragged: (center: Coordinates) => void
  shouldPanTo: boolean
  setShouldPanTo: (value: boolean) => void
  randomMarkers: MarkerData[]
  isLocked: boolean
  onToggleLock: () => void
  onBoundsChanged: (bounds: MapBounds) => void
}

export function MapView({
  latitude,
  longitude,
  onMarkerDragged,
  shouldPanTo,
  setShouldPanTo,
  randomMarkers,
  isLocked,
  onToggleLock,
  onBoundsChanged
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mainMarkerRef = useRef<maplibregl.Marker | null>(null)
  const randomMarkersRef = useRef<maplibregl.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(
    HAS_MAPTILER_KEY ? null : 'MapTiler key missing. Set VITE_MAPTILER_KEY in renderer/.env.local.'
  )

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !HAS_MAPTILER_KEY) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [longitude, latitude],
      zoom: MAP_INITIAL_ZOOM,
      pitch: MAP_INITIAL_PITCH,
      bearing: MAP_INITIAL_BEARING,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: { compact: true }
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

    map.on('load', () => {
      if (!map.getSource('terrain-dem')) {
        map.addSource('terrain-dem', {
          type: 'raster-dem',
          tiles: [TERRAIN_DEM_URL],
          tileSize: 256,
          maxzoom: 14,
          encoding: 'mapbox'
        })
      }

      map.setTerrain({ source: 'terrain-dem', exaggeration: TERRAIN_EXAGGERATION })
      setMapError(null)
    })

    map.on('error', (event) => {
      const message = event?.error?.message || event?.error || event
      console.error('MapLibre error:', message)
      setMapError('Unable to load map or terrain data. Check internet and MapTiler key.')
    })

    const emitBounds = () => {
      const bounds = map.getBounds()
      onBoundsChanged({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    }

    map.on('load', emitBounds)
    map.on('moveend', emitBounds)

    const markerEl = document.createElement('div')
    markerEl.className = 'main-marker'
    markerEl.style.backgroundImage = `url("${MAIN_MARKER_SVG}")`

    const marker = new maplibregl.Marker({
      element: markerEl,
      draggable: !isLocked,
      anchor: 'bottom'
    })
      .setLngLat([longitude, latitude])
      .addTo(map)

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onMarkerDragged({ lat: lngLat.lat, lng: lngLat.lng })
    })

    mapRef.current = map
    mainMarkerRef.current = marker

    return () => {
      marker.remove()
      map.remove()
      mapRef.current = null
      mainMarkerRef.current = null
    }
  }, [latitude, longitude, onBoundsChanged, onMarkerDragged, isLocked])

  useEffect(() => {
    if (!mapRef.current || !mainMarkerRef.current) {
      return
    }

    mainMarkerRef.current.setLngLat([longitude, latitude])
  }, [latitude, longitude])

  useEffect(() => {
    if (!mainMarkerRef.current) {
      return
    }

    mainMarkerRef.current.setDraggable(!isLocked)
  }, [isLocked])

  useEffect(() => {
    if (!mapRef.current || !shouldPanTo) {
      return
    }

    mapRef.current.easeTo({ center: [longitude, latitude], zoom: MAP_INITIAL_ZOOM })
    setShouldPanTo(false)
  }, [shouldPanTo, longitude, latitude, setShouldPanTo])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    randomMarkersRef.current.forEach(marker => marker.remove())
    randomMarkersRef.current = randomMarkers.map(marker =>
      new maplibregl.Marker().setLngLat([marker.lng, marker.lat]).addTo(mapRef.current as maplibregl.Map)
    )
  }, [randomMarkers])

  return (
    <>
      <div className="map-canvas maplibre-map" ref={mapContainerRef} />
      {mapError && <div className="map-error-banner">{mapError}</div>}
      <button
        className={`lock-button ${isLocked ? 'locked' : ''}`}
        onClick={onToggleLock}
        title={isLocked ? 'Unlock marker' : 'Lock marker to current position'}
      >
        {isLocked ? '🔒' : '🔓'}
      </button>
    </>
  )
}
