'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Map Click Handler Component
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Existing Points Layer
function PontosLayer({ pontos }) {
    if (!pontos || pontos.length === 0) return null;

    return (
        <>
            {pontos.map(ponto => (
                <Marker
                    key={ponto.id}
                    position={[parseFloat(ponto.latitude), parseFloat(ponto.longitude)]}
                    icon={createStrategicIcon(ponto.tipo_icone, ponto.cor)}
                >
                    <Popup>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                            <strong>{ponto.titulo}</strong>
                            {ponto.descricao && <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>{ponto.descricao}</p>}
                            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#adb5bd' }}>
                                {ponto.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}

export default function AdminMap({ onMapClick, pontos }) {
    const center = [-22.5, -43.2];

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={center}
                zoom={9}
                style={{ height: '100%', width: '100%' }}
                doubleClickZoom={false}
            >
                <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Click Handler */}
                <MapClickHandler onMapClick={onMapClick} />

                {/* Existing Points */}
                <PontosLayer pontos={pontos} />

                {/* Helper Message */}
                <div
                    style={{
                        position: 'absolute',
                        top: '16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#495057',
                        zIndex: 1000,
                        pointerEvents: 'none'
                    }}
                >
                    👆 Clique no mapa para adicionar um ponto estratégico
                </div>
            </MapContainer>
        </div>
    );
}
