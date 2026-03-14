type CoordinatesBarProps = {
  latitude: number
  longitude: number
  markerIntervalInput: string
  isLocating: boolean
  locationStatus: string | null
  onLatitudeChange: (value: number) => void
  onLongitudeChange: (value: number) => void
  onIntervalChange: (value: string) => void
  onGetCurrentLocation: () => void
}

export function CoordinatesBar({
  latitude,
  longitude,
  markerIntervalInput,
  isLocating,
  locationStatus,
  onLatitudeChange,
  onLongitudeChange,
  onIntervalChange,
  onGetCurrentLocation
}: CoordinatesBarProps) {
  return (
    <div className="coordinates-bar">
      <div className="input-group">
        <label>Latitude</label>
        <input
          type="number"
          value={latitude.toFixed(6)}
          onChange={(e) => onLatitudeChange(parseFloat(e.target.value) || 0)}
          step="0.000001"
        />
      </div>
      <div className="input-group">
        <label>Longitude</label>
        <input
          type="number"
          value={longitude.toFixed(6)}
          onChange={(e) => onLongitudeChange(parseFloat(e.target.value) || 0)}
          step="0.000001"
        />
      </div>
      <div className="input-group">
        <label>Interval (sec)</label>
        <input
          type="number"
          value={markerIntervalInput}
          onChange={(e) => onIntervalChange(e.target.value)}
          min="0"
          max="100"
          step="0.1"
          placeholder="5"
        />
        <button
          type="button"
          className="get-location-button"
          onClick={onGetCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? 'Locating...' : 'Get Location'}
        </button>
        {locationStatus && <span className="location-status">{locationStatus}</span>}
      </div>
    </div>
  )
}
