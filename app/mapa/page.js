'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '../../components/Sidebar/Sidebar';
import SchoolDetails from '../../components/SchoolDetails/SchoolDetails';
import IntelligencePanels from '../../components/Intelligence/IntelligencePanels';
import styles from './page.module.css';

const Map = dynamic(() => import('../../components/Map/Map'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Carregando Mapa...</div>
});

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// Main Content Component
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('mapaeleitoral_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Verify token is still valid
    fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('mapaeleitoral_token');
          localStorage.removeItem('mapaeleitoral_user');
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => setCheckingAuth(false));
  }, [router]);

  // Initialize filters from URL params (Deep Linking)
  const [filters, setFilters] = useState({
    ano: searchParams.get('ano') ? parseInt(searchParams.get('ano')) : 2022,
    cargo: searchParams.get('cargo') || 'PRESIDENTE',
    municipio: searchParams.get('municipio') || '',
    bairro: searchParams.get('bairro') || '',
    zona: searchParams.get('zona') || '',
    partido: searchParams.get('partido') || '',
    candidatoNumero: searchParams.get('candidato') ? parseInt(searchParams.get('candidato')) : null,
    showHeatmap: true,
    showMarkers: true
  });

  const [mapData, setMapData] = useState([]);
  const [pontosEstrategicos, setPontosEstrategicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalVotos: 0, percentualGeral: 0, nome: '', totalLocais: 0, totalCandidatos: 0, totalZonas: 0 });
  const [activeLayer, setActiveLayer] = useState('streets');

  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Comparador State
  const [showComparador, setShowComparador] = useState(false);

  // Intelligence Panel State
  const [activeIntelligencePanel, setActiveIntelligencePanel] = useState(null);

  // Selected candidate name (for intelligence panels)
  const [selectedCandidateName, setSelectedCandidateName] = useState('');

  // Intelligence from school details state
  const [intelligenceFromSchool, setIntelligenceFromSchool] = useState(null);

  // Listen for intelligence panel requests from SchoolDetails
  useEffect(() => {
    const handleOpenIntelligence = (event) => {
      const { panel, candidato, cargo, ano } = event.detail;
      // Update filters to match the selected candidate
      setFilters(prev => ({
        ...prev,
        candidatoNumero: candidato,
        cargo: cargo,
        ano: ano
      }));
      // Open the intelligence panel
      setActiveIntelligencePanel(panel);
    };

    window.addEventListener('openIntelligence', handleOpenIntelligence);
    return () => window.removeEventListener('openIntelligence', handleOpenIntelligence);
  }, []);

  // SET DEFAULT VIEW ONLY ON INITIAL LOAD (when no URL params)
  useEffect(() => {
    // Only set defaults if no candidato AND no cargo was specified
    const hasUrlParams = searchParams.get('cargo') || searchParams.get('candidato');

    if (!hasUrlParams && !filters.candidatoNumero) {
      // First visit without params - set default view
      setFilters(prev => ({ ...prev, ano: 2022, cargo: 'PRESIDENTE', candidatoNumero: 22 }));
    }
  }, []); // Only run once on mount

  // Update URL when filters change (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.ano) params.set('ano', filters.ano.toString());
    if (filters.cargo) params.set('cargo', filters.cargo);
    if (filters.municipio) params.set('municipio', filters.municipio);
    if (filters.bairro) params.set('bairro', filters.bairro);
    if (filters.zona) params.set('zona', filters.zona);
    if (filters.partido) params.set('partido', filters.partido);
    if (filters.candidatoNumero) params.set('candidato', filters.candidatoNumero.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

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

  // Fetch Map Data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ano: filters.ano,
          cargo: filters.cargo,
        });

        if (filters.candidatoNumero) {
          params.append('numero', filters.candidatoNumero);
        }
        if (filters.municipio) {
          params.append('municipio', filters.municipio);
        }
        if (filters.bairro) {
          params.append('bairro', filters.bairro);
        }
        if (filters.zona) {
          params.append('zona', filters.zona);
        }
        if (filters.partido) {
          params.append('partido', filters.partido);
        }

        const res = await fetch(`${API_BASE}/api/mapa?${params.toString()}`);
        const data = await res.json();

        const total = data.reduce((acc, curr) => acc + curr.votos, 0);
        const totalCargo = data.reduce((acc, curr) => acc + curr.total_local, 0);
        const percent = totalCargo > 0 ? ((total / totalCargo) * 100).toFixed(2) : 0;

        // Calculate unique values for stats cards
        const uniqueZonas = new Set(data.map(d => d.zona).filter(Boolean)).size;

        setStats({
          totalVotos: total ?? 0,
          percentualGeral: percent ?? 0,
          nome: filters.candidatoNumero ? `Candidato ${filters.candidatoNumero}` : 'Todos os Locais',
          totalLocais: data.length,
          totalZonas: uniqueZonas
        });

        console.log(`🗳️ [${filters.ano}] Exibindo ${data.length} locais com ${total.toLocaleString()} votos do candidato ${filters.candidatoNumero} no mapa`);

        setMapData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [filters.ano, filters.candidatoNumero, filters.cargo, filters.municipio, filters.bairro, filters.zona, filters.partido]);

  // Fetch Pontos Estratégicos
  useEffect(() => {
    async function fetchPontos() {
      try {
        const res = await fetch(`${API_BASE}/api/mapa/pontos-estrategicos`);
        const data = await res.json();
        setPontosEstrategicos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao buscar pontos estratégicos:', err);
        setPontosEstrategicos([]);
      }
    }
    fetchPontos();
  }, []);

  // Fetch total candidatos and selected candidate name
  useEffect(() => {
    async function fetchCandidatos() {
      try {
        const res = await fetch(`${API_BASE}/api/filtros?ano=${filters.ano}&cargo=${encodeURIComponent(filters.cargo)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setStats(prev => ({ ...prev, totalCandidatos: data.length }));

          // Find selected candidate name
          if (filters.candidatoNumero) {
            const selectedCandidate = data.find(c => c.candidato_numero == filters.candidatoNumero);
            if (selectedCandidate) {
              setStats(prev => ({
                ...prev,
                nome: `${selectedCandidate.candidato_nome} (${selectedCandidate.partido_sigla})`
              }));
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar candidatos:', err);
      }
    }
    fetchCandidatos();
  }, [filters.ano, filters.cargo, filters.candidatoNumero]);

  // Show loading while checking auth
  if (checkingAuth || !isAuthenticated) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
        color: 'white',
        fontSize: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗳️</div>
          <div>Verificando autenticação...</div>
        </div>
      </div>
    );
  }

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
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onIntelligenceClick={(panel) => setActiveIntelligencePanel(panel)}
      />

      {/* Intelligence Panels */}
      <IntelligencePanels
        activePanel={activeIntelligencePanel}
        onClose={() => setActiveIntelligencePanel(null)}
        candidatoNumero={filters.candidatoNumero}
        candidatoNome={stats?.nome || `Candidato ${filters.candidatoNumero}`}
        cargo={filters.cargo}
        ano={filters.ano}
      />

      <div className={`${styles.mapWrapper} ${sidebarCollapsed ? styles.mapWrapperExpanded : ''}`}>
        {loading && <div className={styles.spinner}>Carregando visualização...</div>}

        <Map
          points={mapData}
          pontosEstrategicos={pontosEstrategicos}
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
          selectedCargo={filters.cargo}
        />
      </div>
    </main>
  );
}

// Wrapper with Suspense for Vercel Build (SSR + searchParams)
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗳️</div>
          Carregando Sistema de Inteligência Política...
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
