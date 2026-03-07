import { useCallback, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { CoordinatesBar } from './components/CoordinatesBar'
import { MapView } from './components/MapView'
import { useRandomMarkers } from './hooks/useRandomMarkers'
import type { Coordinates, MapBounds } from './types/map'

function App() {
  const [latitude, setLatitude] = useState(28.45903258)
  const [longitude, setLongitude] = useState(77.06085205)
  const [shouldPanTo, setShouldPanTo] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [markerIntervalInput, setMarkerIntervalInput] = useState('5')
  const [isRandomPaused] = useState(false)
  const mapBoundsRef = useRef<MapBounds | null>(null)
  const randomMarkers = useRandomMarkers({
    latitude,
    longitude,
    markerIntervalInput,
    isRandomPaused,
    mapBoundsRef
  })

  const handleBoundsChanged = useCallback((bounds: MapBounds) => {
    mapBoundsRef.current = bounds
  }, [])

  const handleMarkerDragged = useCallback((center: Coordinates) => {
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

      <CoordinatesBar
        latitude={latitude}
        longitude={longitude}
        markerIntervalInput={markerIntervalInput}
        onLatitudeChange={setLatitude}
        onLongitudeChange={setLongitude}
        onIntervalChange={setMarkerIntervalInput}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-shell">
            <MapView
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
