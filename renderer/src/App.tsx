import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'

const mainMarkerSvg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 24 36">' +
      '<path fill="#e53935" d="M12 0C6.7 0 2.4 4.3 2.4 9.6c0 7.2 9.6 21.6 9.6 21.6s9.6-14.4 9.6-21.6C21.6 4.3 17.3 0 12 0z"/>' +
      '<circle cx="12" cy="10" r="4.2" fill="#ffffff"/>' +
      '</svg>'
  )

type MarkerData = {
  id: number
  lat: number
  lng: number
}

type MapContentProps = {
  latitude: number
  longitude: number
  onMarkerDragged: (center: { lat: number; lng: number }) => void
  shouldPanTo: boolean
  setShouldPanTo: (value: boolean) => void
  randomMarkers: MarkerData[]
  isLocked: boolean
  onToggleLock: () => void
  onBoundsChanged: (bounds: { north: number; south: number; east: number; west: number }) => void
}

function MapContent({
  latitude,
  longitude,
  onMarkerDragged,
  shouldPanTo,
  setShouldPanTo,
  randomMarkers,
  isLocked,
  onToggleLock,
  onBoundsChanged
}: MapContentProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mainMarkerRef = useRef<maplibregl.Marker | null>(null)
  const randomMarkersRef = useRef<maplibregl.Marker[]>([])

  // Use local tiles if available (Electron), fallback to online tiles
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron
  const tileUrl = isElectron
    ? 'http://127.0.0.1:8754/tiles/{z}/{x}/{y}.png'
    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  const roadLineWidth = useMemo(
    () => ['interpolate', ['linear'], ['zoom'], 5, 0.3, 10, 1, 13, 2] as any,
    []
  )

  const mapStyle = useMemo<StyleSpecification>(() => ({
    version: 8 as const,
    sources: {
      osm: {
        type: 'vector' as const,
        tiles: [tileUrl],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background' as const,
        paint: { 'background-color': '#f3f6f4' }
      },
      {
        id: 'water',
        type: 'fill' as const,
        source: 'osm',
        'source-layer': 'water',
        paint: { 'fill-color': '#b7d9ee' }
      },
      {
        id: 'landuse',
        type: 'fill' as const,
        source: 'osm',
        'source-layer': 'landuse',
        paint: { 'fill-color': '#e7efe1' }
      },
      {
        id: 'park',
        type: 'fill' as const,
        source: 'osm',
        'source-layer': 'park',
        paint: { 'fill-color': '#d6ecd0' }
      },
      {
        id: 'landcover',
        type: 'fill' as const,
        source: 'osm',
        'source-layer': 'landcover',
        paint: { 'fill-color': '#eef2e6' }
      },
      {
        id: 'roads',
        type: 'line' as const,
        source: 'osm',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#9aa3a7',
          'line-width': roadLineWidth
        }
      },
      {
        id: 'buildings',
        type: 'fill' as const,
        source: 'osm',
        'source-layer': 'building',
        paint: { 'fill-color': '#d7d3cc' }
      }
    ]
  }), [tileUrl, roadLineWidth])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [longitude, latitude],
      zoom: 5,
      attributionControl: { compact: true }
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('error', (event) => {
      const message = event?.error?.message || event?.error || event
      console.error('MapLibre error:', message)
    })

    map.on('load', () => {
      const bounds = map.getBounds()
      onBoundsChanged({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    })

    map.on('moveend', () => {
      const bounds = map.getBounds()
      onBoundsChanged({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      })
    })

    const markerEl = document.createElement('div')
    markerEl.className = 'main-marker'
    markerEl.style.backgroundImage = `url("${mainMarkerSvg}")`

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
    mapRef.current.easeTo({ center: [longitude, latitude], zoom: 12 })
    setShouldPanTo(false)
  }, [shouldPanTo, longitude, latitude, setShouldPanTo])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }
    randomMarkersRef.current.forEach(marker => marker.remove())
    randomMarkersRef.current = randomMarkers.map(marker =>
      new maplibregl.Marker()
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current as maplibregl.Map)
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

function App() {
  const [latitude, setLatitude] = useState(20.5937)
  const [longitude, setLongitude] = useState(78.9629)
  const [shouldPanTo, setShouldPanTo] = useState(false)
  const [randomMarkers, setRandomMarkers] = useState<MarkerData[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [markerIntervalInput, setMarkerIntervalInput] = useState('5')
  const [isRandomPaused] = useState(false)
  const mapBoundsRef = useRef<{
    north: number
    south: number
    east: number
    west: number
  } | null>(null)

  const handleBoundsChanged = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    mapBoundsRef.current = bounds
  }, [])

  // Generate random coordinates within a 10km radius of the current marker
  const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const earthRadiusKm = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return earthRadiusKm * c
  }

  // Generate random coordinates within a 10km radius and within the viewport
  const generateRandomCoordinates = () => {
    const radiusKm = 10
    const bounds = mapBoundsRef.current
    if (!bounds) {
      return {
        id: Date.now() + Math.random(),
        lat: latitude,
        lng: longitude
      }
    }

    const maxAttempts = 25
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south)
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west)
      const distanceKm = getDistanceKm(latitude, longitude, lat, lng)
      if (distanceKm <= radiusKm) {
        return {
          id: Date.now() + Math.random(),
          lat,
          lng
        }
      }
    }

    return {
      id: Date.now() + Math.random(),
      lat: latitude,
      lng: longitude
    }
  }

  // Generate random markers on a configurable interval
  useEffect(() => {
    const parsedValue = Number(markerIntervalInput)
    const clampedValue = Number.isFinite(parsedValue)
      ? Math.min(100, Math.max(0, parsedValue))
      : 0
    const intervalMs = clampedValue * 1000
    if (intervalMs <= 0 || isRandomPaused) {
      return
    }
    const interval = setInterval(() => {
      const newMarker = generateRandomCoordinates()
      setRandomMarkers(prev => [...prev, newMarker])
    }, intervalMs)

    return () => clearInterval(interval)
  }, [latitude, longitude, markerIntervalInput, isRandomPaused])

  const handleMarkerDragged = useCallback((center: { lat: number; lng: number }) => {
    if (!isLocked) {
      setLatitude(center.lat)
      setLongitude(center.lng)
    }
  }, [isLocked])

  const toggleLock = useCallback(() => {
    setIsLocked(prev => !prev)
  }, [])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-icon">
            <span className="app-title-dot" aria-hidden="true"></span>
          </div>
          <div className="header-title">
            <h1>PinPath</h1>
            <p>Explore and Manage</p>
          </div>
        </div>
      </header>

      {/* Coordinates Bar */}
      <div className="coordinates-bar">
        <div className="input-group">
          <label>Latitude</label>
          <input 
            type="number" 
            value={latitude.toFixed(6)}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            step="0.000001"
          />
        </div>
        <div className="input-group">
          <label>Longitude</label>
          <input 
            type="number" 
            value={longitude.toFixed(6)}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            step="0.000001"
          />
        </div>
        <div className="input-group">
          <label>Interval (sec)</label>
          <input 
            type="number" 
            value={markerIntervalInput}
            onChange={(e) => setMarkerIntervalInput(e.target.value)}
            min="0"
            max="100"
            step="0.1"
            placeholder="5"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-shell">
            <MapContent 
              latitude={latitude} 
              longitude={longitude} 
              onMarkerDragged={handleMarkerDragged}
              shouldPanTo={shouldPanTo}
              setShouldPanTo={setShouldPanTo}
              randomMarkers={randomMarkers}
              isLocked={isLocked}
              onToggleLock={toggleLock}
              onBoundsChanged={handleBoundsChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
