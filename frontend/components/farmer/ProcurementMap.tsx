"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
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

const farmerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:34px;
      height:34px;
      border-radius:50%;
      background:#24543d;
      border:4px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:15px;
      font-weight:700;
    ">F</div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

const recommendedIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#b26a27;
      border:4px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,.3);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      font-weight:700;
    ">★</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

const centreIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:32px;
      height:32px;
      border-radius:50%;
      background:#3f7d57;
      border:4px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.25);
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:13px;
      font-weight:700;
    ">P</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

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

    points.push([
      recommendedCentre.latitude,
      recommendedCentre.longitude,
    ]);

    alternatives.forEach((centre) => {
      points.push([
        centre.latitude,
        centre.longitude,
      ]);
    });

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [
    map,
    recommendedCentre,
    alternatives,
    farmerLatitude,
    farmerLongitude,
  ]);

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
    <div className="min-w-[210px] text-[#18352a]">
      <div className="text-sm font-bold">
        {centre.centre_name}
      </div>

      {recommended && (
        <div className="mt-1 text-xs font-semibold text-[#b26a27]">
          Recommended centre
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
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
    <div className="relative overflow-hidden rounded-[26px] border border-[#d5ddd6] bg-[#e7ece7]">
      <MapContainer
        center={mapCentre}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[360px] w-full"
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

        {hasFarmerLocation && (
          <>
            <CircleMarker
              center={[
                farmerLatitude!,
                farmerLongitude!,
              ]}
              radius={18}
              pathOptions={{
                color: "#24543d",
                fillColor: "#24543d",
                fillOpacity: 0.12,
                weight: 2,
              }}
            />

            <Marker
              position={[
                farmerLatitude!,
                farmerLongitude!,
              ]}
              icon={farmerIcon}
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
            </Marker>
          </>
        )}

        <Marker
          position={[
            recommendedCentre.latitude,
            recommendedCentre.longitude,
          ]}
          icon={recommendedIcon}
        >
          <Popup>
            <CentrePopup
              centre={recommendedCentre}
              recommended
            />
          </Popup>
        </Marker>

        {alternatives.map((centre) => (
          <Marker
            key={
              centre.centre_id ??
              `${centre.latitude}-${centre.longitude}`
            }
            position={[
              centre.latitude,
              centre.longitude,
            ]}
            icon={centreIcon}
          >
            <Popup>
              <CentrePopup centre={centre} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-[#d5ddd6] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 text-[10px] font-semibold text-[#536158]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#24543d]" />
            You
          </div>

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
