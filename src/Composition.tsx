import * as turf from "@turf/turf";
import type { Feature, LineString } from "geojson";
import maplibregl, { type GeoJSONSource, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { routes } from "./routes";

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

const distanceAlong = (totalDistance: number, progress: number) => {
  // Turf can error on zero-length slices, so keep the route non-empty at frame 0.
  return Math.max(0.001, totalDistance * clampProgress(progress));
};

const getCameraOptions = ({
  map,
  targetRoute,
  cameraRoute,
  targetDistance,
  cameraDistance,
  progress,
  altitude,
}: {
  map: Map;
  targetRoute: Feature<LineString>;
  cameraRoute: Feature<LineString>;
  targetDistance: number;
  cameraDistance: number;
  progress: number;
  altitude: number;
}) => {
  const target = turf.along(
    targetRoute,
    distanceAlong(targetDistance, progress),
  ).geometry.coordinates;
  const camera = turf.along(
    cameraRoute,
    distanceAlong(cameraDistance, progress),
  ).geometry.coordinates;

  return map.calculateCameraOptionsFromTo(
    new maplibregl.LngLat(camera[0], camera[1]),
    altitude,
    new maplibregl.LngLat(target[0], target[1]),
  );
};

export const MyComposition = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  const { durationInFrames, height, width } = useVideoConfig();
  const [loadingHandle] = useState(() => delayRender("Loading MapLibre map"));
  const [map, setMap] = useState<Map | null>(null);

  const targetRoute = useMemo(() => turf.lineString(routes.target), []);
  const cameraRoute = useMemo(() => turf.lineString(routes.camera), []);
  const targetDistance = useMemo(() => turf.length(targetRoute), [targetRoute]);
  const cameraDistance = useMemo(() => turf.length(cameraRoute), [cameraRoute]);

  const getPartialRoute = useCallback(
    (progress: number) => {
      return turf.lineSliceAlong(
        targetRoute,
        0,
        distanceAlong(targetDistance, progress),
      );
    },
    [targetDistance, targetRoute],
  );

  const getMovingPoint = useCallback(
    (progress: number) => {
      return turf.along(targetRoute, distanceAlong(targetDistance, progress));
    },
    [targetDistance, targetRoute],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: routes.target[0],
      zoom: 12,
      pitch: 65,
      bearing: -180,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });

    mapInstance.on("load", () => {
      mapInstance.addSource("trace", {
        type: "geojson",
        data: getPartialRoute(0),
      });

      mapInstance.addLayer({
        id: "route-shadow",
        type: "line",
        source: "trace",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.9,
          "line-width": 9,
        },
      });

      mapInstance.addLayer({
        id: "route-line",
        type: "line",
        source: "trace",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#111827",
          "line-width": 5,
        },
      });

      mapInstance.addSource("moving-point", {
        type: "geojson",
        data: getMovingPoint(0),
      });

      mapInstance.addLayer({
        id: "moving-point-dot",
        type: "circle",
        source: "moving-point",
        paint: {
          "circle-color": "#ef4444",
          "circle-radius": 9,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 4,
        },
      });

      mapInstance.jumpTo(
        getCameraOptions({
          map: mapInstance,
          targetRoute,
          cameraRoute,
          targetDistance,
          cameraDistance,
          progress: 0,
          altitude: 4000,
        }),
      );

      mapInstance.once("idle", () => {
        setMap(mapInstance);
        continueRender(loadingHandle);
      });
    });
  }, [
    cameraDistance,
    cameraRoute,
    continueRender,
    getMovingPoint,
    getPartialRoute,
    loadingHandle,
    targetDistance,
    targetRoute,
  ]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handle = delayRender("Rendering MapLibre frame");
    const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const altitude = interpolate(
      progress,
      [0, 0.15, 0.85, 1],
      [4000, 9000, 9000, 4500],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      },
    );

    map.getSource<GeoJSONSource>("trace")?.setData(getPartialRoute(progress));
    map
      .getSource<GeoJSONSource>("moving-point")
      ?.setData(getMovingPoint(progress));
    map.jumpTo(
      getCameraOptions({
        map,
        targetRoute,
        cameraRoute,
        targetDistance,
        cameraDistance,
        progress,
        altitude,
      }),
    );

    map.once("idle", () => continueRender(handle));
    map.triggerRepaint();
  }, [
    cameraDistance,
    cameraRoute,
    continueRender,
    delayRender,
    durationInFrames,
    frame,
    getMovingPoint,
    getPartialRoute,
    map,
    targetDistance,
    targetRoute,
  ]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#dbeafe" }}>
      <div ref={containerRef} style={{ height, position: "absolute", width }} />
    </AbsoluteFill>
  );
};
