"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type Centre = {
  centre_id?: string;
  centre_name: string;
  latitude: number;
  longitude: number;
  predicted_waiting_time_minutes: number;
  queue_length: number;
  capacity_used_pct: number;
  active_counters: number;
  distance_km?: number;
  score?: number;
  reason?: string;
};

export type ProcurementMapProps = {
  recommendedCentre: Centre;
  alternatives: Centre[];
  farmerLatitude?: number | null;
  farmerLongitude?: number | null;
};

function FitMapBounds({
  recommendedCentre,
  alternatives,
  farmerLatitude,
  farmerLongitude,
}: ProcurementMapProps) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    if (
      farmerLatitude !== null &&
      farmerLatitude !== undefined &&
      farmerLongitude !== null &&
      farmerLongitude !== undefined
    ) {
      points.push([farmerLatitude, farmerLongitude]);
    }

    if (recommendedCentre) {
      points.push([
        recommendedCentre.latitude,
        recommendedCentre.longitude,
      ]);
    }

    alternatives.forEach((centre) => {
      points.push([centre.latitude, centre.longitude]);
    });

    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13, {
        animate: false,
      });
      return;
    }

    const bounds: LatLngBoundsExpression = points;

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
      animate: false,
    });
  }, [
    map,
    recommendedCentre,
    alternatives,
    farmerLatitude,
    farmerLongitude,
  ]);

  /*
   * Leaflet sometimes calculates its container size
   * before the browser has finished painting the
   * dynamically mounted component.
   *
   * invalidateSize() forces Leaflet to recalculate
   * the map dimensions after mount.
   */
  useEffect(() => {
    const timers = [
      window.setTimeout(() => {
        map.invalidateSize(false);
      }, 50),

      window.setTimeout(() => {
        map.invalidateSize(false);
      }, 250),

      window.setTimeout(() => {
        map.invalidateSize(false);
      }, 600),
    ];

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, [map]);

  return null;
}

function CentrePopup({
  centre,
  recommended = false,
}: {
  centre: Centre;
  recommended?: boolean;
}) {
  return (
    <div className="min-w-[190px]">
      <div className="text-sm font-bold text-[#18352a]">
        {recommended ? "Recommended Centre" : "Alternative Centre"}
      </div>

      <div className="mt-1 text-sm font-semibold text-[#18352a]">
        {centre.centre_name}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <div className="text-[#7a857d]">Waiting</div>
          <div className="font-semibold">
            {centre.predicted_waiting_time_minutes} min
          </div>
        </div>

        <div>
          <div className="text-[#7a857d]">Queue</div>
          <div className="font-semibold">
            {centre.queue_length}
          </div>
        </div>

        <div>
          <div className="text-[#7a857d]">Capacity</div>
          <div className="font-semibold">
            {centre.capacity_used_pct}%
          </div>
        </div>

        <div>
          <div className="text-[#7a857d]">Counters</div>
          <div className="font-semibold">
            {centre.active_counters}
          </div>
        </div>
      </div>

      {centre.distance_km !== undefined && (
        <div className="mt-3 border-t border-gray-200 pt-2 text-xs">
          <span className="text-[#7a857d]">
            Distance:{" "}
          </span>

          <span className="font-semibold">
            {centre.distance_km} km
          </span>
        </div>
      )}

      {centre.reason && (
        <div className="mt-3 text-xs leading-4 text-[#59665d]">
          {centre.reason}
        </div>
      )}
    </div>
  );
}

export default function ProcurementMap({
  recommendedCentre,
  alternatives,
  farmerLatitude,
  farmerLongitude,
}: ProcurementMapProps) {
  const hasFarmerLocation =
    farmerLatitude !== null &&
    farmerLatitude !== undefined &&
    farmerLongitude !== null &&
    farmerLongitude !== undefined;

  const fallbackCentre: [number, number] = [
    23.1815,
    79.9864,
  ];

  const mapCentre: [number, number] = [
    recommendedCentre?.latitude ??
      fallbackCentre[0],
    recommendedCentre?.longitude ??
      fallbackCentre[1],
  ];

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-[26px] border border-[#d5ddd6] bg-[#e7ece7]">
      <MapContainer
        center={mapCentre}
        zoom={13}
        scrollWheelZoom={false}
        dragging={true}
        doubleClickZoom={true}
        zoomControl={true}
        className="!h-full !w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapBounds
          recommendedCentre={recommendedCentre}
          alternatives={alternatives}
          farmerLatitude={farmerLatitude}
          farmerLongitude={farmerLongitude}
        />

        {/* Farmer / You */}
        {hasFarmerLocation && (
          <>
            <CircleMarker
              center={[
                farmerLatitude!,
                farmerLongitude!,
              ]}
              radius={12}
              pathOptions={{
                color: "#24543d",
                fillColor: "#24543d",
                fillOpacity: 0.2,
                weight: 3,
              }}
            >
              <Popup>
                <div className="text-sm font-semibold text-[#18352a]">
                  Your location
                </div>

                <div className="mt-1 text-xs text-[#68746c]">
                  GPS location used for distance-aware
                  recommendation.
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* Recommended Centre */}
        <CircleMarker
          center={[
            recommendedCentre.latitude,
            recommendedCentre.longitude,
          ]}
          radius={13}
          pathOptions={{
            color: "#8a4f1d",
            fillColor: "#b26a27",
            fillOpacity: 0.9,
            weight: 4,
          }}
        >
          <Popup>
            <CentrePopup
              centre={recommendedCentre}
              recommended
            />
          </Popup>
        </CircleMarker>

        {/* Alternative Centres */}
        {alternatives.map((centre) => (
          <CircleMarker
            key={
              centre.centre_id ??
              `${centre.latitude}-${centre.longitude}`
            }
            center={[
              centre.latitude,
              centre.longitude,
            ]}
            radius={10}
            pathOptions={{
              color: "#2f6848",
              fillColor: "#3f7d57",
              fillOpacity: 0.85,
              weight: 3,
            }}
          >
            <Popup>
              <CentrePopup centre={centre} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-[#d5ddd6] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 text-[10px] font-semibold text-[#536158]">
          {hasFarmerLocation && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#24543d]" />
              You
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b26a27]" />
            Recommended
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3f7d57]" />
            Alternative
          </div>
        </div>
      </div>
    </div>
  );
}
