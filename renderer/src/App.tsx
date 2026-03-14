import { useCallback, useRef, useState } from 'react'
import './App.css'
import { CoordinatesBar } from './components/CoordinatesBar'
import { MapView } from './components/MapView'
import { useRandomMarkers } from './hooks/useRandomMarkers'
import type { Coordinates, MapBounds } from './types/map'

function App() {
  const [latitude, setLatitude] = useState(28.45903258)
  const [longitude, setLongitude] = useState(77.06085205)
  const [panToRequestId, setPanToRequestId] = useState(0)
  const [markerIntervalInput, setMarkerIntervalInput] = useState('5')
  const [isRandomPaused] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
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
    setLatitude(center.lat)
    setLongitude(center.lng)
  }, [])

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported in this runtime.')
      return
    }

    setIsLocating(true)
    setLocationStatus('Fetching current location...')

    const getPosition = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })

    const getIpLocation = async () => {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) {
        throw new Error('IP location lookup failed.')
      }

      const data = (await response.json()) as { latitude?: number; longitude?: number }
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        throw new Error('Invalid IP location response.')
      }

      return { lat: data.latitude, lng: data.longitude }
    }

    const updateLocation = (lat: number, lng: number, statusText: string) => {
      setLatitude(lat)
      setLongitude(lng)
      setPanToRequestId((id) => id + 1)
      setLocationStatus(statusText)
      setIsLocating(false)
    }

    void (async () => {
      try {
        const precise = await getPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
        updateLocation(precise.coords.latitude, precise.coords.longitude, 'Location updated (GPS).')
        return
      } catch {
        // Retry with lower-accuracy desktop-friendly options.
      }

      try {
        const coarse = await getPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 120000
        })
        updateLocation(coarse.coords.latitude, coarse.coords.longitude, 'Location updated (device).')
        return
      } catch {
        // Fallback to IP lookup if browser geolocation cannot resolve.
      }

      try {
        const ip = await getIpLocation()
        updateLocation(ip.lat, ip.lng, 'Location updated (IP fallback, approximate).')
      } catch {
        setLocationStatus('Could not fetch location. Check OS location access or network.')
        setIsLocating(false)
      }
    })()
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
        isLocating={isLocating}
        locationStatus={locationStatus}
        onLatitudeChange={setLatitude}
        onLongitudeChange={setLongitude}
        onIntervalChange={setMarkerIntervalInput}
        onGetCurrentLocation={handleGetCurrentLocation}
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
              panToRequestId={panToRequestId}
              randomMarkers={randomMarkers}
              onBoundsChanged={handleBoundsChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
