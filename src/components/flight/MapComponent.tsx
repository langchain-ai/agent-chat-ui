"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { FlightSearchCriteria } from "@/types/flightSearchCriteria";
import { MapPin, Plane, Calendar, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import MapBox CSS
import "mapbox-gl/dist/mapbox-gl.css";

interface MapComponentProps {
  flightSearchCriteria?: FlightSearchCriteria;
  streamData?: any;
}

// Airport coordinates database (you can expand this)
const AIRPORT_COORDINATES: { [key: string]: [number, number] } = {
  // Major Indian airports
  DEL: [77.1025, 28.5562], // Delhi
  BOM: [72.8777, 19.0896], // Mumbai
  BLR: [77.7064, 12.9716], // Bangalore
  MAA: [80.1693, 13.0827], // Chennai
  CCU: [88.4467, 22.6547], // Kolkata
  HYD: [78.4298, 17.2403], // Hyderabad
  AMD: [72.6369, 23.0726], // Ahmedabad
  COK: [76.4019, 10.1520], // Kochi
  GOI: [73.8314, 15.3808], // Goa
  PNQ: [73.9197, 18.5822], // Pune

  // Major international airports
  JFK: [-73.7781, 40.6413], // New York JFK
  LAX: [-118.4085, 33.9425], // Los Angeles
  LHR: [-0.4614, 51.4700], // London Heathrow
  CDG: [2.5479, 49.0097], // Paris Charles de Gaulle
  DXB: [55.3644, 25.2532], // Dubai
  SIN: [103.9915, 1.3644], // Singapore
  NRT: [140.3929, 35.7720], // Tokyo Narita
  ICN: [126.7975, 37.4691], // Seoul Incheon
  HKG: [113.9148, 22.3080], // Hong Kong
  SYD: [151.1772, -33.9399], // Sydney

  // Add more airports as needed
};

export const MapView: React.FC<MapComponentProps> = ({
  flightSearchCriteria,
  streamData
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get MapBox token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
                     process.env.NEXT_PUBLIC_MAP_BOX ||
                     "pk.your_mapbox_token";

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set MapBox access token
    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [77.1025, 28.5562], // Default to Delhi
      zoom: 2,
      projection: "globe" as any,
    });

    map.current.on("load", () => {
      setMapLoaded(true);

      // Add atmosphere for 3D globe effect
      if (map.current) {
        map.current.setFog({
          color: "rgb(186, 210, 235)",
          "high-color": "rgb(36, 92, 223)",
          "horizon-blend": 0.02,
          "space-color": "rgb(11, 11, 25)",
          "star-intensity": 0.6,
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !flightSearchCriteria) return;

    const { originAirport, destinationAirport } = flightSearchCriteria;

    if (!originAirport || !destinationAirport) return;

    const originCoords = AIRPORT_COORDINATES[originAirport];
    const destCoords = AIRPORT_COORDINATES[destinationAirport];

    if (!originCoords || !destCoords) {
      console.warn(`Coordinates not found for airports: ${originAirport}, ${destinationAirport}`);
      return;
    }

    // Clear existing layers and sources
    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }
    if (map.current.getSource("airports")) {
      map.current.removeLayer("airports");
      map.current.removeSource("airports");
    }

    // Add flight route line
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [originCoords, destCoords],
        },
      },
    });

    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });

    // Add airport markers
    map.current.addSource("airports", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              title: originAirport,
              type: "origin",
            },
            geometry: {
              type: "Point",
              coordinates: originCoords,
            },
          },
          {
            type: "Feature",
            properties: {
              title: destinationAirport,
              type: "destination",
            },
            geometry: {
              type: "Point",
              coordinates: destCoords,
            },
          },
        ],
      },
    });

    map.current.addLayer({
      id: "airports",
      type: "circle",
      source: "airports",
      paint: {
        "circle-radius": 8,
        "circle-color": [
          "case",
          ["==", ["get", "type"], "origin"],
          "#10b981", // Green for origin
          "#ef4444", // Red for destination
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Add labels for airports
    map.current.addLayer({
      id: "airport-labels",
      type: "symbol",
      source: "airports",
      layout: {
        "text-field": ["get", "title"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 1.25],
        "text-anchor": "top",
        "text-size": 12,
      },
      paint: {
        "text-color": "#374151",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
    });

    // Fit map to show both airports
    const bounds = new mapboxgl.LngLatBounds()
      .extend(originCoords)
      .extend(destCoords);

    map.current.fitBounds(bounds, {
      padding: 100,
      maxZoom: 8,
    });

    // Add popup on click
    map.current.on("click", "airports", (e) => {
      const feature = e.features![0];
      const geometry = feature.geometry as any;
      const coordinates = geometry.coordinates?.slice() || [0, 0];
      const title = feature.properties!.title;
      const type = feature.properties!.type;

      new mapboxgl.Popup()
        .setLngLat(coordinates as [number, number])
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${title}</h3>
            <p class="text-sm text-gray-600">${type === "origin" ? "Origin" : "Destination"}</p>
          </div>
        `)
        .addTo(map.current!);
    });

    // Change cursor on hover
    map.current.on("mouseenter", "airports", () => {
      if (map.current) map.current.getCanvas().style.cursor = "pointer";
    });

    map.current.on("mouseleave", "airports", () => {
      if (map.current) map.current.getCanvas().style.cursor = "";
    });

  }, [mapLoaded, flightSearchCriteria]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalPassengers = () => {
    if (!flightSearchCriteria) return 0;
    return (flightSearchCriteria.adults || 0) +
           (flightSearchCriteria.children || 0) +
           (flightSearchCriteria.infants || 0);
  };

  return (
    <div className="w-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Flight Route Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Map Container */}
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg overflow-hidden border"
            style={{ minHeight: "400px" }}
          />

          {/* Flight Information Below Map */}
          {flightSearchCriteria && (
            <div className="mt-6 space-y-4">
              {/* Route Summary */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {flightSearchCriteria.originAirport || "---"}
                  </div>
                  <div className="text-sm text-gray-600">Origin</div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="w-8 h-0.5 bg-blue-400"></div>
                    <Plane className="w-6 h-6 text-blue-500 mx-2" />
                    <div className="w-8 h-0.5 bg-blue-400"></div>
                    {flightSearchCriteria.isRoundTrip && (
                      <>
                        <Plane className="w-6 h-6 text-green-500 mx-2 rotate-180" />
                        <div className="w-8 h-0.5 bg-green-400"></div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {flightSearchCriteria.destinationAirport || "---"}
                  </div>
                  <div className="text-sm text-gray-600">Destination</div>
                </div>
              </div>

              {/* Flight Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Departure:</span>
                    <span className="text-sm">{formatDate(flightSearchCriteria.departureDate)}</span>
                  </div>

                  {flightSearchCriteria.isRoundTrip && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Return:</span>
                      <span className="text-sm">{formatDate(flightSearchCriteria.returnDate)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Passengers:</span>
                    <span className="text-sm">{getTotalPassengers()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Class:</span>
                    <Badge variant="outline" className="capitalize">
                      {flightSearchCriteria.class || "Economy"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Trip Type:</span>
                    <Badge variant={flightSearchCriteria.isRoundTrip ? "default" : "secondary"}>
                      {flightSearchCriteria.isRoundTrip ? "Round Trip" : "One Way"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Passenger Breakdown */}
              {getTotalPassengers() > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Passenger Details:</h4>
                  <div className="flex gap-4 text-sm">
                    {flightSearchCriteria.adults > 0 && (
                      <span>Adults: {flightSearchCriteria.adults}</span>
                    )}
                    {flightSearchCriteria.children > 0 && (
                      <span>Children: {flightSearchCriteria.children}</span>
                    )}
                    {flightSearchCriteria.infants > 0 && (
                      <span>Infants: {flightSearchCriteria.infants}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Data State */}
          {!flightSearchCriteria && (
            <div className="mt-6 text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No Flight Route to Display
              </h3>
              <p className="text-gray-500">
                Flight search criteria will appear here once available from the conversation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
