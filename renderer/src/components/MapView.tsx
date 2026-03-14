import { useEffect, useRef, useState } from 'react'
import {
  CameraEventType,
  Cartesian3,
  Cartographic,
  Color,
  ConstantPositionProperty,
  buildModuleUrl,
  defined,
  Ellipsoid,
  EllipsoidTerrainProvider,
  Math as CesiumMath,
  NearFarScalar,
  OpenStreetMapImageryProvider,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  TileMapServiceImageryProvider,
  Viewer,
  type Entity
} from 'cesium'
import {
  MAP_INITIAL_BEARING,
  MAP_INITIAL_CAMERA_HEIGHT_M,
  RANDOM_MARKER_ALTITUDE_MAX_M,
  RANDOM_MARKER_ALTITUDE_MIN_M
} from '../constants/map'
import type { Coordinates, MapBounds, MarkerData } from '../types/map'

type MapViewProps = {
  latitude: number
  longitude: number
  onMarkerDragged: (center: Coordinates) => void
  panToRequestId: number
  randomMarkers: MarkerData[]
  onBoundsChanged: (bounds: MapBounds) => void
}

const DEFAULT_PITCH_DEGREES = -40
const DRAG_THRESHOLD_PX = 2

export function MapView({
  latitude,
  longitude,
  onMarkerDragged,
  panToRequestId,
  randomMarkers,
  onBoundsChanged
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null)
  const mainEntityRef = useRef<Entity | null>(null)
  const randomEntitiesRef = useRef<Entity[]>([])
  const didLeftDragRef = useRef(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || viewerRef.current) {
      return
    }

    let viewer: Viewer

    try {
      viewer = new Viewer(mapContainerRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayerPicker: false,
        baseLayer: false,
        terrainProvider: new EllipsoidTerrainProvider()
      })
    } catch (error) {
      console.error('Cesium initialization failed:', error)
      setMapError('Cesium failed to initialize. Check GPU/WebGL support and restart the app.')
      return
    }

    viewer.useBrowserRecommendedResolution = false
    viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2)
    viewer.scene.globe.maximumScreenSpaceError = 1.2
    viewer.scene.globe.depthTestAgainstTerrain = true

    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(
      new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      })
    )

    TileMapServiceImageryProvider.fromUrl(buildModuleUrl('Assets/Textures/NaturalEarthII'))
      .then((fallbackProvider) => {
        if (viewer.imageryLayers.length === 0) {
          viewer.imageryLayers.addImageryProvider(fallbackProvider)
        }
      })
      .catch(() => {
        // Fallback load failure is non-fatal when OSM is available.
      })

    setMapError(null)
    viewer.scene.renderError.addEventListener((sceneError) => {
      console.error('Cesium render error:', sceneError)
      setMapError('Map rendering failed. Try restarting the app or updating graphics drivers.')
    })

    const cameraController = viewer.scene.screenSpaceCameraController
    cameraController.enableTranslate = false
    cameraController.enableRotate = true
    cameraController.enableTilt = true
    cameraController.enableZoom = true
    cameraController.enableLook = false
    cameraController.translateEventTypes = []
    cameraController.rotateEventTypes = [CameraEventType.LEFT_DRAG]
    cameraController.tiltEventTypes = [CameraEventType.RIGHT_DRAG]

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(longitude, latitude, MAP_INITIAL_CAMERA_HEIGHT_M),
      orientation: {
        heading: CesiumMath.toRadians(MAP_INITIAL_BEARING),
        pitch: CesiumMath.toRadians(DEFAULT_PITCH_DEGREES),
        roll: 0
      }
    })

    const emitBounds = () => {
      const rectangle = viewer.camera.computeViewRectangle(Ellipsoid.WGS84)
      if (!rectangle) {
        return
      }

      onBoundsChanged({
        north: CesiumMath.toDegrees(rectangle.north),
        south: CesiumMath.toDegrees(rectangle.south),
        east: CesiumMath.toDegrees(rectangle.east),
        west: CesiumMath.toDegrees(rectangle.west)
      })
    }

    viewer.camera.moveEnd.addEventListener(emitBounds)
    emitBounds()

    const mainEntity = viewer.entities.add({
      position: Cartesian3.fromDegrees(longitude, latitude, 0),
      point: {
        pixelSize: 14,
        color: Color.fromCssColorString('#ef4444'),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        scaleByDistance: new NearFarScalar(5.0e2, 1.1, 2.0e7, 0.55)
      }
    })

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction(() => {
      didLeftDragRef.current = false
    }, ScreenSpaceEventType.LEFT_DOWN)

    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      const deltaX = Math.abs(event.endPosition.x - event.startPosition.x)
      const deltaY = Math.abs(event.endPosition.y - event.startPosition.y)
      if (deltaX > DRAG_THRESHOLD_PX || deltaY > DRAG_THRESHOLD_PX) {
        didLeftDragRef.current = true
      }
    }, ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      if (didLeftDragRef.current) {
        didLeftDragRef.current = false
        return
      }

      const cartesian = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid)
      if (!defined(cartesian)) {
        return
      }

      const cartographic = Cartographic.fromCartesian(cartesian)
      const nextCoordinates = {
        lat: CesiumMath.toDegrees(cartographic.latitude),
        lng: CesiumMath.toDegrees(cartographic.longitude)
      }

      mainEntity.position = new ConstantPositionProperty(
        Cartesian3.fromDegrees(nextCoordinates.lng, nextCoordinates.lat, 0)
      )
      onMarkerDragged(nextCoordinates)
    }, ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer
    handlerRef.current = handler
    mainEntityRef.current = mainEntity

    return () => {
      viewer.camera.moveEnd.removeEventListener(emitBounds)
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
      handlerRef.current = null
      mainEntityRef.current = null
      randomEntitiesRef.current = []
      didLeftDragRef.current = false
    }
  }, [latitude, longitude, onBoundsChanged, onMarkerDragged])

  useEffect(() => {
    if (!mainEntityRef.current) {
      return
    }

    mainEntityRef.current.position = new ConstantPositionProperty(
      Cartesian3.fromDegrees(longitude, latitude, 0)
    )
  }, [latitude, longitude])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || panToRequestId === 0) {
      return
    }

    const { heading, pitch, roll } = viewer.camera
    const currentHeight = viewer.camera.positionCartographic.height
    const targetHeight = Number.isFinite(currentHeight) && currentHeight > 0
      ? currentHeight
      : MAP_INITIAL_CAMERA_HEIGHT_M

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(longitude, latitude, targetHeight),
      orientation: {
        heading,
        pitch,
        roll
      },
      duration: 0.9
    })
  }, [panToRequestId, longitude, latitude])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) {
      return
    }

    randomEntitiesRef.current.forEach((entity) => viewer.entities.remove(entity))

    randomEntitiesRef.current = randomMarkers.map((marker) =>
      viewer.entities.add({
        position: Cartesian3.fromDegrees(marker.lng, marker.lat, marker.alt),
        point: {
          pixelSize: 9,
          color: Color.fromCssColorString('#22c55e'),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        polyline: {
          positions: [
            Cartesian3.fromDegrees(marker.lng, marker.lat, 0),
            Cartesian3.fromDegrees(marker.lng, marker.lat, marker.alt)
          ],
          width: 1.5,
          material: Color.fromCssColorString('#22c55e').withAlpha(0.45)
        },
        description: `Altitude: ${Math.round(marker.alt)} m`
      })
    )
  }, [randomMarkers])

  return (
    <>
      <div className="map-canvas cesium-map" ref={mapContainerRef} />
      {mapError && <div className="map-error-banner">{mapError}</div>}
      <div className="altitude-legend">
        Random marker altitude: {RANDOM_MARKER_ALTITUDE_MIN_M}m to {RANDOM_MARKER_ALTITUDE_MAX_M}m
        <br />
        3D controls: left-drag orbit, right-drag tilt, wheel zoom, left-click set marker.
      </div>
    </>
  )
}
