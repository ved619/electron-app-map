import { useEffect, useMemo, useRef } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import {
  MAIN_MARKER_SVG,
  MAP_INITIAL_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  TILE_URL
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

  const mapStyle = useMemo<StyleSpecification>(() => ({
    version: 8 as const,
    sources: {
      satellite: {
        type: 'raster' as const,
        tiles: [TILE_URL],
        tileSize: 256,
        minzoom: MAP_MIN_ZOOM,
        maxzoom: MAP_MAX_ZOOM
      }
    },
    layers: [
      {
        id: 'satellite',
        type: 'raster' as const,
        source: 'satellite',
        paint: {}
      }
    ]
  }), [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [longitude, latitude],
      zoom: MAP_INITIAL_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: { compact: true }
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('error', (event) => {
      const message = event?.error?.message || event?.error || event
      console.error('MapLibre error:', message)
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
  }, [latitude, longitude, onBoundsChanged, onMarkerDragged, mapStyle, isLocked])

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
