import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import { RANDOM_MARKER_ALTITUDE_MAX_M, RANDOM_MARKER_ALTITUDE_MIN_M } from '../constants/map'
import type { MapBounds, MarkerData } from '../types/map'

const MAX_RANDOM_DISTANCE_KM = 10
const MAX_COORD_ATTEMPTS = 25

const createMarkerId = () => Date.now() + Math.random()

const getRandomAltitude = () =>
  RANDOM_MARKER_ALTITUDE_MIN_M +
  Math.random() * (RANDOM_MARKER_ALTITUDE_MAX_M - RANDOM_MARKER_ALTITUDE_MIN_M)

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

type UseRandomMarkersArgs = {
  latitude: number
  longitude: number
  markerIntervalInput: string
  isRandomPaused: boolean
  mapBoundsRef: RefObject<MapBounds | null>
}

export function useRandomMarkers({
  latitude,
  longitude,
  markerIntervalInput,
  isRandomPaused,
  mapBoundsRef
}: UseRandomMarkersArgs): MarkerData[] {
  const [randomMarkers, setRandomMarkers] = useState<MarkerData[]>([])

  const intervalMs = useMemo(() => {
    const parsedValue = Number(markerIntervalInput)
    const clampedValue = Number.isFinite(parsedValue)
      ? Math.min(100, Math.max(0, parsedValue))
      : 0
    return clampedValue * 1000
  }, [markerIntervalInput])

  const generateRandomCoordinates = useCallback((): MarkerData => {
    const bounds = mapBoundsRef.current
    if (!bounds) {
      return {
        id: createMarkerId(),
        lat: latitude,
        lng: longitude,
        alt: getRandomAltitude()
      }
    }

    for (let attempt = 0; attempt < MAX_COORD_ATTEMPTS; attempt += 1) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south)
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west)
      const distanceKm = getDistanceKm(latitude, longitude, lat, lng)

      if (distanceKm <= MAX_RANDOM_DISTANCE_KM) {
        return {
          id: createMarkerId(),
          lat,
          lng,
          alt: getRandomAltitude()
        }
      }
    }

    return {
      id: createMarkerId(),
      lat: latitude,
      lng: longitude,
      alt: getRandomAltitude()
    }
  }, [latitude, longitude, mapBoundsRef])

  useEffect(() => {
    if (intervalMs <= 0 || isRandomPaused) {
      return
    }

    const interval = setInterval(() => {
      const newMarker = generateRandomCoordinates()
      setRandomMarkers(prev => [...prev, newMarker])
    }, intervalMs)

    return () => clearInterval(interval)
  }, [generateRandomCoordinates, intervalMs, isRandomPaused])

  return randomMarkers
}
