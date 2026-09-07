"use client";

import { useEffect, useMemo } from "react";
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

type Centre = {
  centre_id: string;
  centre_name: string;
  latitude: number;
  longitude: number;
  queue_length: number;
  active_counters: number;
  avg_processing_time: number;
  capacity_used_pct: number;
  distance_km?: number;
  predicted_waiting_time_minutes?: number;
  score?: number;
  rank?: number;
  reason?: string;
};

type ProcurementMapProps = {
  recommendedCentre: Centre | null | undefined;
  alternatives?: Centre[];
  farmerLatitude?: number | null;
  farmerLongitude?: number | null;
};

const farmerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #18352a;
      border: 4px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 700;
    ">●</div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const recommendedIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #b26a27;
      border: 4px solid white;
      box-shadow: 0 3px 12px rgba(0,0,0,0.30);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 17px;
      font-weight: 700;
    ">★</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const centreIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #24543d;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 700;
    ">P</div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function FitMapBounds({
  recommendedCentre,
  alternatives,
  farmerLatitude,
  farmerLongitude,
}: ProcurementMapProps) {
  const map = useMap();

  const points = useMemo(() => {
    const result: [number, number][] = [];

    if (
      typeof farmerLatitude === "number" &&
      typeof farmerLongitude === "number"
    ) {
      result.push([farmerLatitude, farmerLongitude]);
    }

    if (
      recommendedCentre &&
      typeof recommendedCentre.latitude === "number" &&
      typeof recommendedCentre.longitude === "number"
    ) {
      result.push([
        recommendedCentre.latitude,
        recommendedCentre.longitude,
      ]);
    }

    for (const centre of alternatives ?? []) {
      if (
        typeof centre.latitude === "number" &&
        typeof centre.longitude === "number"
      ) {
        result.push([
          centre.latitude,
          centre.longitude,
        ]);
      }
    }

    return result;
  }, [
    recommendedCentre,
    alternatives,
    farmerLatitude,
    farmerLongitude,
  ]);

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    const bounds = L.latLngBounds(points);

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}

function CentrePopup({
  centre,
}: {
  centre: Centre;
}) {
  return (
    <div style={{ minWidth: 190 }}>
      <strong style={{ fontSize: 14 }}>
        {centre.centre_name}
      </strong>

      {centre.rank === 1 && (
        <div
          style={{
            marginTop: 5,
            marginBottom: 7,
            fontSize: 11,
            fontWeight: 700,
            color: "#b26a27",
          }}
        >
          ★ Recommended Centre
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <div>
          <strong>Waiting:</strong>{" "}
          {centre.predicted_waiting_time_minutes ?? "—"} min
        </div>

        <div>
          <strong>Queue:</strong>{" "}
          {centre.queue_length ?? "—"}
        </div>

        <div>
          <strong>Capacity:</strong>{" "}
          {centre.capacity_used_pct ?? "—"}%
        </div>

        <div>
          <strong>Counters:</strong>{" "}
          {centre.active_counters ?? "—"}
        </div>

        {typeof centre.distance_km === "number" &&
          centre.distance_km > 0 && (
            <div>
              <strong>Distance:</strong>{" "}
              {centre.distance_km} km
            </div>
          )}
      </div>
    </div>
  );
}

export default function ProcurementMap({
  recommendedCentre,
  alternatives = [],
  farmerLatitude = null,
  farmerLongitude = null,
}: ProcurementMapProps) {
  const fallbackCentre =
    recommendedCentre ?? alternatives[0];

  const mapCentre = fallbackCentre ?? {
    latitude: 23.1815,
    longitude: 79.9864,
  };

  const hasFarmerLocation =
    typeof farmerLatitude === "number" &&
    typeof farmerLongitude === "number";

  const otherCentres = alternatives.filter(
    (item) =>
      item.centre_id !==
      recommendedCentre?.centre_id
  );

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[#d8d2c5] bg-[#e9e5da]">
      <MapContainer
        center={[
          mapCentre.latitude,
          mapCentre.longitude,
        ]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
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
            <Marker
              position={[
                farmerLatitude,
                farmerLongitude,
              ]}
              icon={farmerIcon}
            >
              <Popup>
                <strong>Your location</strong>
                <br />
                GPS location detected.
              </Popup>
            </Marker>

            <CircleMarker
              center={[
                farmerLatitude,
                farmerLongitude,
              ]}
              radius={12}
              pathOptions={{
                color: "#18352a",
                weight: 2,
                fillColor: "#18352a",
                fillOpacity: 0.08,
              }}
            />
          </>
        )}

        {recommendedCentre && (
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
              />
            </Popup>
          </Marker>
        )}

        {otherCentres.map((item) => (
          <Marker
            key={item.centre_id}
            position={[
              item.latitude,
              item.longitude,
            ]}
            icon={centreIcon}
          >
            <Popup>
              <CentrePopup centre={item} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-[#ded8cb] bg-[#f7f4ec]/95 px-3 py-2 text-[10px] text-[#667169] shadow-sm backdrop-blur">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#18352a]" />
            Your location
          </span>

          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b26a27]" />
            Recommended
          </span>

          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#24543d]" />
            Other centres
          </span>
        </div>
      </div>
    </div>
  );
}
