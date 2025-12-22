'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '../components/Sidebar/Sidebar';
import SchoolDetails from '../components/SchoolDetails/SchoolDetails';
import styles from './page.module.css';

const Map = dynamic(() => import('../components/Map/Map'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Carregando Mapa...</div>
});

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params (Deep Linking)
  const [filters, setFilters] = useState({
    ano: searchParams.get('ano') ? parseInt(searchParams.get('ano')) : 2022,
    cargo: searchParams.get('cargo') || 'PRESIDENTE',
    municipio: searchParams.get('municipio') || '',
    partido: null,
    candidatoNumero: searchParams.get('candidato') ? parseInt(searchParams.get('candidato')) : null,
    showHeatmap: true,
    showMarkers: true
  });

  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalVotos: 0, percentualGeral: 0, nome: '' });
  const [activeLayer, setActiveLayer] = useState('streets');

  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);

  // Comparador State
  const [showComparador, setShowComparador] = useState(false);

  // Update URL when filters change (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.ano) params.set('ano', filters.ano.toString());
    if (filters.cargo) params.set('cargo', filters.cargo);
    if (filters.municipio) params.set('municipio', filters.municipio);
    if (filters.candidatoNumero) params.set('candidato', filters.candidatoNumero.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters.ano, filters.cargo, filters.municipio, filters.candidatoNumero]);

  const handleSchoolSelectFromSearch = (school) => {
    if (school.latitude && school.longitude) {
      setFlyToCoords({ lat: school.latitude, lng: school.longitude, zoom: 15 });
      setSelectedSchoolId(school.id);
    }
  };

  // Export CSV Function
  const handleExportCSV = useCallback(() => {
    if (!mapData || mapData.length === 0) {
      alert('Nenhum dado para exportar. Selecione um candidato primeiro.');
      return;
    }

    const headers = ['Local', 'Bairro', 'Cidade', 'Votos', 'Percentual'];
    const rows = mapData.map(p => [
      `"${p.nome || ''}"`,
      `"${p.bairro || ''}"`,
      `"${p.cidade || ''}"`,
      p.votos,
      `${p.percent}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranking_${filters.cargo}_${filters.candidatoNumero}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [mapData, filters.cargo, filters.candidatoNumero]);

  // Share URL Function
  const handleShareURL = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a área de transferência!');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      prompt('Copie o link:', url);
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      // Allow fetching map without candidate to show base layer (schools)
      // if (!filters.candidatoNumero) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          ano: filters.ano,
          cargo: filters.cargo,
          // numero: filters.candidatoNumero // Now optional
        });

        if (filters.candidatoNumero) {
          params.append('numero', filters.candidatoNumero);
        }

        // Add municipio filter if selected
        if (filters.municipio) {
          params.append('municipio', filters.municipio);
        }

        const res = await fetch(`http://localhost:3001/api/mapa?${params.toString()}`);
        const data = await res.json();

        const total = data.reduce((acc, curr) => acc + curr.votos, 0);
        const totalCargo = data.reduce((acc, curr) => acc + curr.total_local, 0);
        const percent = totalCargo > 0 ? ((total / totalCargo) * 100).toFixed(2) : 0;

        setStats({
          totalVotos: total ?? 0,
          percentualGeral: percent ?? 0,
          nome: filters.candidatoNumero ? `Candidato ${filters.candidatoNumero}` : 'Todos os Locais'
        });

        // Console log for debugging
        console.log(`🗳️ [${filters.ano}] Exibindo ${data.length} locais com ${total.toLocaleString()} votos do candidato ${filters.candidatoNumero} no mapa`);

        setMapData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters.ano, filters.candidatoNumero, filters.cargo, filters.municipio]);

  return (
    <main className={styles.main}>
      <Sidebar
        filters={filters}
        setFilters={setFilters}
        stats={stats}
        onToggleLayer={setActiveLayer}
        onSchoolSelect={handleSchoolSelectFromSearch}
        onExportCSV={handleExportCSV}
        onShareURL={handleShareURL}
        onOpenComparador={() => setShowComparador(true)}
        showComparador={showComparador}
        onCloseComparador={() => setShowComparador(false)}
        mapData={mapData}
      />

      <div className={styles.mapWrapper}>
        {loading && <div className={styles.spinner}>Carregando visualização...</div>}

        <Map
          points={mapData}
          showHeatmap={filters.showHeatmap}
          showMarkers={filters.showMarkers}
          onSchoolClick={(id) => setSelectedSchoolId(id)}
          activeLayer={activeLayer}
          flyToCoords={flyToCoords}
        />

        <SchoolDetails
          schoolId={selectedSchoolId}
          onClose={() => setSelectedSchoolId(null)}
          selectedCandidateNum={filters.candidatoNumero}
        />
      </div>
    </main>
  );
}



