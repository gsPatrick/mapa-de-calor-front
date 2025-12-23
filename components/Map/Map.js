'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import styles from './map.module.css';

// Fix Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Cluster Icon Creator
const createClusterCustomIcon = function (cluster) {
    return L.divIcon({
        html: `<div><span>${cluster.getChildCount()}</span></div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

// Strategic Point Icon Creator
const createStrategicIcon = (tipo, cor) => {
    const icons = {
        star: '⭐',
        flag: '🚩',
        pin: '📍',
        alert: '⚠️',
        target: '🎯'
    };

    const icon = icons[tipo] || icons.star;

    return L.divIcon({
        html: `
            <div style="
                background: ${cor || '#FF5722'};
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 3px solid white;
            ">
                ${icon}
            </div>
        `,
        className: 'strategic-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
};

// Componente Interno para Heatmap
function HeatmapLayer({ points }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const hasVoteData = points.some(p => p.votos !== undefined && p.votos > 0);
        if (!hasVoteData) return;

        const highestVote = Math.max(...points.map(p => p.votos || 0), 1);

        const heatPoints = points
            .filter(p => p.lat != null && p.lng != null && p.votos > 0)
            .map(p => [p.lat, p.lng, p.votos]);

        const heat = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 20,
            maxZoom: 12,
            max: highestVote * 0.4,
            gradient: {
                0.2: '#333333',
                0.4: '#555555',
                0.6: '#888888',
                0.8: '#bbbbbb',
                1.0: '#ffffff'
            },
            minOpacity: 0.25
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map]);

    return null;
}

// Markers Controller - Native Leaflet Implementation via useMap
function MarkersController({ points, onSchoolClick }) {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const markers = L.markerClusterGroup({
            chunkedLoading: true,
            chunkInterval: 200,
            chunkDelay: 50,
            iconCreateFunction: createClusterCustomIcon,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 60
        });

        const markerList = points
            .filter(p => p.lat != null && p.lng != null)
            .map(p => {
                const marker = L.marker([p.lat, p.lng]);

                const hasVotes = p.votos > 0;
                const popupContent = `
                    <div style="font-family: 'Inter', sans-serif; font-size: 13px; min-width: 220px;">
                        <strong style="font-size: 13px; color: #fff;">${p.nome}</strong>
                        ${p.bairro ? `<br/><span style="color: rgba(255,255,255,0.5); font-size: 11px;">📍 ${p.bairro}${p.cidade ? `, ${p.cidade}` : ''}</span>` : ''}
                        ${hasVotes ? `
                            <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase;">Votos</span>
                                    <strong style="color: #fff; font-size: 16px; font-family: monospace;">${p.votos.toLocaleString()}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: rgba(255,255,255,0.5); font-size: 10px; text-transform: uppercase;">% Local</span>
                                    <strong style="color: #4ade80; font-size: 14px; font-family: monospace;">${p.percent}%</strong>
                                </div>
                            </div>
                        ` : '<div style="margin-top: 8px; color: rgba(255,255,255,0.4); font-size: 11px; text-align: center;">Selecione um candidato</div>'}
                        <div style="margin-top: 10px; font-size: 10px; color: rgba(255,255,255,0.6); font-weight: 600; text-align: center; padding: 8px; background: rgba(255,255,255,0.08); border-radius: 8px; text-transform: uppercase;">
                            Ver ranking →
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent, {
                    maxWidth: 300,
                    className: 'custom-popup'
                });

                marker.on('click', () => {
                    if (onSchoolClick) onSchoolClick(p.id);
                });

                return marker;
            });

        markers.addLayers(markerList);
        map.addLayer(markers);

        return () => {
            map.removeLayer(markers);
        };
    }, [points, map, onSchoolClick]);

    return null;
}

// Strategic Points Layer
function StrategicPointsLayer({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length === 0) return;

        const layerGroup = L.layerGroup();

        pontos.forEach(ponto => {
            const marker = L.marker([ponto.lat, ponto.lng], {
                icon: createStrategicIcon(ponto.tipo_icone, ponto.cor)
            });

            const popupContent = `
                <div style="font-family: 'Inter', sans-serif; font-size: 13px; min-width: 180px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 20px;">${ponto.tipo_icone === 'star' ? '⭐' : ponto.tipo_icone === 'flag' ? '🚩' : ponto.tipo_icone === 'alert' ? '⚠️' : '📍'}</span>
                        <strong style="font-size: 14px; color: #212529;">${ponto.titulo}</strong>
                    </div>
                    ${ponto.descricao ? `<p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.4;">${ponto.descricao}</p>` : ''}
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e9ecef; font-size: 10px; color: #adb5bd;">
                        Ponto Estratégico
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 250,
                className: 'strategic-popup'
            });

            layerGroup.addLayer(marker);
        });

        layerGroup.addTo(map);

        return () => {
            map.removeLayer(layerGroup);
        };
    }, [pontos, map]);

    return null;
}

// FlyTo Controller Component
function FlyToController({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords && coords.lat && coords.lng) {
            map.flyTo([coords.lat, coords.lng], coords.zoom || 15, {
                duration: 1.5
            });
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

export default function MapComponent({
    points,
    pontosEstrategicos,
    showHeatmap,
    showMarkers,
    onSchoolClick,
    activeLayer,
    flyToCoords
}) {
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

                {/* Heatmap Layer */}
                {showHeatmap && <HeatmapLayer points={points} />}

                {/* Optimized Markers using Native Leaflet Cluster */}
                {showMarkers && points && (
                    <MarkersController points={points} onSchoolClick={onSchoolClick} />
                )}

                {/* Strategic Points Layer */}
                {pontosEstrategicos && pontosEstrategicos.length > 0 && (
                    <StrategicPointsLayer pontos={pontosEstrategicos} />
                )}

                {/* Custom Legend Control */}
                {showHeatmap && points && points.length > 0 && points.some(p => p.votos > 0) && (
                    <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto', margin: '20px' }}>
                        <div className="leaflet-control" style={{
                            background: '#0a0a0a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '14px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            fontFamily: "'Inter', sans-serif",
                            minWidth: '160px'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                                Intensidade
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{
                                    height: '6px',
                                    width: '100%',
                                    background: 'linear-gradient(to right, #333333, #555555, #888888, #bbbbbb, #ffffff)',
                                    borderRadius: '3px'
                                }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                                    <span>0</span>
                                    <span>{Math.round(Math.max(...points.map(p => p.votos), 1) / 2).toLocaleString()}</span>
                                    <span>{Math.max(...points.map(p => p.votos), 1).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </MapContainer>
        </div>
    );
}
