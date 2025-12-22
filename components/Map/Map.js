'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import styles from './map.module.css';

// Fix Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente Interno para Heatmap
function HeatmapLayer({ points }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        // Auto-Scale Max Intensity based on highest vote count in dataset
        const highestVote = Math.max(...points.map(p => p.votos), 1);

        // Data format: [lat, lng, intensity]
        // API returns keys: lat, lng, votos (already parsed as numbers by backend service)
        const heatPoints = points
            .filter(p => p.lat != null && p.lng != null)
            .map(p => [p.lat, p.lng, p.votos]);

        const heat = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 20,
            maxZoom: 12,
            max: highestVote * 0.4, // Lower intensity to avoid opaque blobs
            gradient: {
                0.2: 'blue',
                0.4: 'cyan',
                0.6: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            },
            minOpacity: 0.2 // More transparent
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map]);

    return null;
}

import MarkerClusterGroup from 'react-leaflet-cluster';

// ... (imports remain)

// Custom Cluster Icon Creator
const createClusterCustomIcon = function (cluster) {
    return L.divIcon({
        html: `<div><span>${cluster.getChildCount()}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

// ... (HeatmapLayer remains)

// FlyTo Controller Component
function FlyToController({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.lat && coords.lng) {
            map.flyTo([coords.lat, coords.lng], coords.zoom || 15);
        }
    }, [coords, map]);
    return null;
}

// FitBounds Controller - Auto-center on data change
function FitBoundsController({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points || points.length === 0) return;

        const validPoints = points.filter(p => p.lat != null && p.lng != null);
        if (validPoints.length === 0) return;

        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });

        console.log(`🗺️ Mapa centralizado em ${validPoints.length} pontos`);
    }, [points, map]);
    return null;
}

export default function MapComponent({ points, showHeatmap, showMarkers, onSchoolClick, activeLayer, flyToCoords }) {
    const center = [-22.5, -43.2];

    const layers = {
        streets: {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; CARTO'
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution: '&copy; Esri'
        },
        dark: {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; CARTO'
        }
    };

    const currentLayer = layers[activeLayer] || layers.streets;

    return (
        <div className={styles.container}>
            <MapContainer
                center={center}
                zoom={9}
                style={{ height: "100%", width: "100%" }}
                className={styles.map}
                doubleClickZoom={false}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution={currentLayer.attribution}
                    url={currentLayer.url}
                />

                {/* FlyTo Controller */}
                <FlyToController coords={flyToCoords} />

                {/* FitBounds Controller - Auto-center on data */}
                <FitBoundsController points={points} />

                {showHeatmap && <HeatmapLayer points={points} />}

                {showMarkers && points && (
                    <MarkerClusterGroup
                        chunkedLoading
                        iconCreateFunction={createClusterCustomIcon}
                    >
                        {points.map(p => (
                            <Marker
                                key={p.id}
                                position={[p.lat, p.lng]}
                                eventHandlers={{
                                    click: () => onSchoolClick(p.id)
                                }}
                            >
                                <Popup>
                                    <strong>{p.nome}</strong><br />
                                    Votos: {p.votos} ({p.percent}%)<br />
                                    <small>Clique para ver Ranking Completo</small>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                )}

                {/* Custom Legend Control */}
                {showHeatmap && points && points.length > 0 && (
                    <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto', margin: '20px' }}>
                        <div className="leaflet-control" style={{
                            background: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            fontFamily: 'sans-serif',
                            minWidth: '150px'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intensidade de Votos</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {/* Gradient Bar */}
                                <div style={{
                                    height: '10px',
                                    width: '100%',
                                    background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)',
                                    borderRadius: '5px'
                                }}></div>
                                {/* Labels */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666', marginTop: '2px' }}>
                                    <span>0</span>
                                    <span>{Math.round(Math.max(...points.map(p => p.votos), 1) / 2).toLocaleString()}</span>
                                    <span>{Math.max(...points.map(p => p.votos), 1).toLocaleString()}+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </MapContainer>
        </div>
    );
}
