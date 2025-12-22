'use client';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from './sidebar.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// Custom Styles for React Select to match the light theme
const customStyles = {
    control: (provided) => ({
        ...provided,
        borderRadius: '6px',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#adb5bd'
        }
    }),
    menu: (provided) => ({
        ...provided,
        zIndex: 9999
    })
};
// Comparador Section Component - Matching HTML Reference
// Comparador Section Component - Temporal Analysis
function ComparadorSection({ initialAno, cargo }) {
    const [year1, setYear1] = useState(2018);
    const [year2, setYear2] = useState(initialAno || 2022);
    const [options1, setOptions1] = useState([]);
    const [options2, setOptions2] = useState([]);
    const [cand1, setCand1] = useState('');
    const [cand2, setCand2] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load options for Year 1
    useEffect(() => {
        async function load1() {
            const res = await fetch(`${API_BASE}/api/filtros?ano=${year1}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setOptions1(data.map(c => ({ value: c.candidato_numero, label: `${c.candidato_nome} (${c.partido_sigla})` })));
            }
        }
        load1();
    }, [year1]);

    // Load options for Year 2
    useEffect(() => {
        async function load2() {
            const res = await fetch(`${API_BASE}/api/filtros?ano=${year2}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setOptions2(data.map(c => ({ value: c.candidato_numero, label: `${c.candidato_nome} (${c.partido_sigla})` })));
            }
        }
        load2();
    }, [year2]);

    const handleCompare = async () => {
        if (!cand1 || !cand2) return;
        setLoading(true);
        setResult(null);
        try {
            const [res1, res2] = await Promise.all([
                fetch(`${API_BASE}/api/mapa?ano=${year1}&cargo=${cargo}&numero=${cand1}`),
                fetch(`${API_BASE}/api/mapa?ano=${year2}&cargo=${cargo}&numero=${cand2}`)
            ]);
            const [d1, d2] = await Promise.all([res1.json(), res2.json()]);

            const calc = (data) => {
                const total = data.reduce((a, c) => a + c.votos, 0);
                const base = data.reduce((a, c) => a + c.total_local, 0);
                return { votos: total, percent: base > 0 ? ((total / base) * 100).toFixed(2) : 0 };
            };

            const r1 = calc(d1);
            const r2 = calc(d2);
            const c1Name = options1.find(c => String(c.value) === String(cand1))?.label || cand1;
            const c2Name = options2.find(c => String(c.value) === String(cand2))?.label || cand2;

            const diff = r2.votos - r1.votos; // Variação do 2 em relação ao 1
            const diffPercent = r1.votos > 0 ? ((diff / r1.votos) * 100).toFixed(2) : 0;

            setResult({
                c1: { name: c1Name, votos: r1.votos, percent: r1.percent, year: year1 },
                c2: { name: c2Name, votos: r2.votos, percent: r2.percent, year: year2 },
                diff: diff,
                diffPercent: diffPercent,
                isEvolution: String(cand1) === String(cand2) && year1 !== year2
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Control Row 1: Years */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                    value={year1}
                    onChange={(e) => { setYear1(e.target.value); setCand1(''); }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}
                >
                    <option value="2018">2018</option>
                    <option value="2022">2022</option>
                </select>
                <select
                    value={year2}
                    onChange={(e) => { setYear2(e.target.value); setCand2(''); }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}
                >
                    <option value="2018">2018</option>
                    <option value="2022">2022</option>
                </select>
            </div>

            {/* Control Row 2: Candidates */}
            <select
                value={cand1}
                onChange={(e) => setCand1(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', background: 'white', cursor: 'pointer' }}
            >
                <option value="">Candidato ({year1})</option>
                {options1.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select
                value={cand2}
                onChange={(e) => setCand2(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '6px', fontSize: '13px', background: 'white', cursor: 'pointer' }}
            >
                <option value="">Candidato ({year2})</option>
                {options2.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <button
                onClick={handleCompare}
                disabled={!cand1 || !cand2 || loading}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!cand1 || !cand2 || loading) ? 0.6 : 1
                }}
            >
                {loading ? 'Comparando...' : 'Analisar Variação'}
            </button>
            {result && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>{result.c1.year}</span>
                            <p style={{ fontSize: '11px', color: '#666', margin: '4px 0' }}>{result.c1.name.split('(')[0]}</p>
                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#6366f1', margin: 0 }}>{result.c1.votos.toLocaleString()}</p>
                            <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>{result.c1.percent}%</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#e0e0e0', padding: '2px 6px', borderRadius: '4px' }}>{result.c2.year}</span>
                            <p style={{ fontSize: '11px', color: '#666', margin: '4px 0' }}>{result.c2.name.split('(')[0]}</p>
                            <p style={{ fontSize: '18px', fontWeight: '700', color: '#d32f2f', margin: 0 }}>{result.c2.votos.toLocaleString()}</p>
                            <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>{result.c2.percent}%</p>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', textAlign: 'center' }}>
                        {result.isEvolution ? (
                            <>
                                <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>Variação Temporal</p>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: result.diff >= 0 ? '#4CAF50' : '#d32f2f', margin: 0 }}>
                                    {result.diff >= 0 ? '▲' : '▼'} {Math.abs(result.diff).toLocaleString()} votos
                                </p>
                                <p style={{ fontSize: '12px', color: result.diff >= 0 ? '#4CAF50' : '#d32f2f', margin: 0 }}>
                                    ({result.diff >= 0 ? '+' : ''}{result.diffPercent}%)
                                </p>
                            </>
                        ) : (
                            <p style={{ margin: 0, fontSize: '12px', color: '#333' }}>
                                Diferença: <strong style={{ color: '#333' }}>{Math.abs(result.diff).toLocaleString()}</strong> votos
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ filters, setFilters, onToggleLayer, onSchoolSelect, onExportCSV, onShareURL, onOpenComparador, showComparador, onCloseComparador, mapData }) {
    const [stats, setStats] = useState(null);
    const [candidatosOptions, setCandidatosOptions] = useState([]);
    const [municipiosOptions, setMunicipiosOptions] = useState([]);
    const [activeLayer, setActiveLayer] = useState('streets');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // 1. Fetch Filters Options (Reload when year changes)
    useEffect(() => {
        async function loadOptions() {
            try {
                // Candidatos - filtered by year
                const resFiltros = await fetch(`${API_BASE}/api/filtros?ano=${filters.ano}`);
                const dataFiltros = await resFiltros.json();
                if (Array.isArray(dataFiltros)) {
                    setCandidatosOptions(dataFiltros.map(c => ({
                        value: c.candidato_numero,
                        label: `${c.candidato_nome} (${c.partido_sigla})`,
                        sq: c.sq_candidato
                    })));
                }

                // Municipios (same for all years)
                const resMuni = await fetch(`${API_BASE}/api/municipios`);
                const dataMuni = await resMuni.json();
                if (Array.isArray(dataMuni)) {
                    setMunicipiosOptions([
                        { value: '', label: 'Todo o Estado' },
                        ...dataMuni.map(m => ({ value: m, label: m }))
                    ]);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadOptions();
    }, [filters.ano]);

    // 2. Fetch Stats whenever Filters Change
    useEffect(() => {
        async function fetchStats() {
            const params = new URLSearchParams();
            if (filters.ano) params.append('ano', filters.ano);
            if (filters.cargo) params.append('cargo', filters.cargo);
            if (filters.municipio) params.append('municipio', filters.municipio);
            if (filters.zona) params.append('zona', filters.zona);
            // if (filters.candidatoNum) ... (Filtered stats by candidate? Maybe not necessary for general dashboard unless selected)

            try {
                const res = await fetch(`${API_BASE}/api/stats?${params.toString()}`);
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to load stats", err);
            }
        }
        fetchStats();
    }, [filters]);

    // Helpers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleLayerChange = (layer) => {
        setActiveLayer(layer);
        onToggleLayer(layer);
    };

    // Search Handler with Debounce
    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/api/escolas/busca?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSchool = (school) => {
        if (onSchoolSelect) {
            onSchoolSelect(school);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    // Chart Data
    const chartData = {
        labels: stats?.partyDistribution?.slice(0, 5).map(p => p.partido_sigla) || [],
        datasets: [
            {
                data: stats?.partyDistribution?.slice(0, 5).map(p => p.votos) || [],
                backgroundColor: ['#1976D2', '#d32f2f', '#388e3c', '#fbc02d', '#7b1fa2'],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className={styles.sidebar}>
            {/* HERDER PREMIUM */}
            <div className={styles.header}>
                <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', animation: 'pulse 3s infinite' }}></div>
                <h1 className={styles.headerTitle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v0M9 12v0M9 15v0M9 18v0" />
                    </svg>
                    Mapa Eleitoral RJ
                </h1>
                <p className={styles.headerSubtitle}>
                    {filters.ano} • {filters.cargo} • Turno 1
                </p>
            </div>

            <div className={styles.scrollArea}>
                {/* RESUMO EXECUTIVO (Cards) */}
                <div className={styles.resumoGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                        </div>
                        <h2 className={styles.metricValue}>{stats?.summary?.total_votos ? (stats.summary.total_votos / 1000).toFixed(1) + 'k' : '-'}</h2>
                        <p className={styles.metricLabel}>Total Votos</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2"><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M8 12h8M8 16h4" /></svg>
                        </div>
                        <h2 className={styles.metricValue}>{stats?.summary?.total_locais || '-'}</h2>
                        <p className={styles.metricLabel}>Locais Votação</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                        </div>
                        <h2 className={styles.metricValue}>{stats?.summary?.total_candidatos || '-'}</h2>
                        <p className={styles.metricLabel}>Candidatos</p>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <h2 className={styles.metricValue}>{stats?.summary?.total_zonas || '-'}</h2>
                        <p className={styles.metricLabel}>Zonas</p>
                    </div>
                </div>

                {/* TOP CANDIDATOS */}
                <div className={styles.topCandidates}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        Top Candidatos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats?.topCandidates?.map((cand, idx) => (
                            <div key={idx} className={styles.candidatoItem}>
                                <div className={styles.candidatoHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Image Removed */}
                                        <div className={styles.candidatoNome} title={cand.candidato_nome}>
                                            {cand.candidato_nome} ({(cand.partido_sigla)})
                                        </div>
                                    </div>
                                    <div className={styles.candidatoStats}>
                                        <span className={styles.candidatoVotos}>{parseInt(cand.votos).toLocaleString()}</span>
                                        <span className={styles.candidatoPercentual}>{cand.percent}%</span>
                                    </div>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <div
                                        className={styles.progressBar}
                                        style={{ width: `${cand.percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) || <p style={{ fontSize: '12px', color: '#999' }}>Carregando...</p>}
                    </div>
                </div>

                {/* FILTROS AVANÇADOS */}
                <div className={styles.sidebarSection} style={{ borderLeft: '4px solid #1976D2' }}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        Filtros
                    </h3>

                    {/* Ano (Year Selector) */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Ano da Eleição</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => handleFilterChange('ano', 2018)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: filters.ano === 2018 ? '2px solid #1976D2' : '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    background: filters.ano === 2018 ? '#e3f2fd' : 'white',
                                    color: filters.ano === 2018 ? '#1976D2' : '#333',
                                    fontWeight: filters.ano === 2018 ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px'
                                }}
                            >
                                2018
                            </button>
                            <button
                                onClick={() => handleFilterChange('ano', 2022)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: filters.ano === 2022 ? '2px solid #1976D2' : '1px solid #dee2e6',
                                    borderRadius: '6px',
                                    background: filters.ano === 2022 ? '#e3f2fd' : 'white',
                                    color: filters.ano === 2022 ? '#1976D2' : '#333',
                                    fontWeight: filters.ano === 2022 ? '600' : '400',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px'
                                }}
                            >
                                2022
                            </button>
                        </div>
                    </div>

                    {/* Cargo */}
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Cargo</label>
                        <Select
                            options={[
                                { value: 'PRESIDENTE', label: 'Presidente' },
                                { value: 'GOVERNADOR', label: 'Governador' },
                                { value: 'SENADOR', label: 'Senador' },
                                { value: 'DEPUTADO FEDERAL', label: 'Deputado Federal' },
                                { value: 'DEPUTADO ESTADUAL', label: 'Deputado Estadual' }
                            ]}
                            value={{ value: filters.cargo, label: filters.cargo }}
                            onChange={(opt) => handleFilterChange('cargo', opt.value)}
                            styles={customStyles}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Município</label>
                        <Select
                            options={municipiosOptions}
                            placeholder="Selecione..."
                            onChange={(opt) => handleFilterChange('municipio', opt?.value)}
                            styles={customStyles}
                            isClearable
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Candidato</label>
                        <Select
                            options={candidatosOptions}
                            placeholder="Buscar candidato..."
                            onChange={(opt) => {
                                handleFilterChange('candidatoNum', opt?.value);
                            }}
                            styles={customStyles}
                            isClearable
                        />
                    </div>

                    <button className={styles.resetBtn} onClick={() => setFilters(prev => ({ ...prev, municipio: '', candidatoNum: '' }))}>
                        Limpar Filtros
                    </button>
                </div>

                {/* INSIGHTS */}
                {stats?.topCandidates?.[0] && (
                    <div className={styles.insights}>
                        <h3 className={styles.sectionTitle}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                            Insights
                        </h3>
                        <div className={styles.insightItem}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                            <span>
                                <span style={{ fontWeight: 600 }}>{stats.topCandidates[0].candidato_nome}</span> liderou com <span style={{ fontWeight: 600 }}>{parseInt(stats.topCandidates[0].votos).toLocaleString()} votos ({stats.topCandidates[0].percent}%)</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* CHART */}
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10h-10V2z" /></svg>
                        Distribuição por Partido
                    </h3>
                    <div style={{ position: 'relative', height: '200px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        {stats ? <Pie data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /> : 'Carregando...'}
                    </div>
                </div>

                {/* COMPARADOR DE CANDIDATOS - Matching HTML */}
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle} onClick={onOpenComparador} style={{ cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" /><circle cx="12" cy="12" r="3" /></svg>
                        Comparar Candidatos {showComparador ? '▲' : '▼'}
                    </h3>
                    {showComparador && (
                        <ComparadorSection
                            initialAno={filters.ano}
                            cargo={filters.cargo}
                        />
                    )}
                </div>

                {/* ACTIONS */}
                <div className={styles.acoesGrid}>
                    <button className={`${styles.btnAcao} ${styles.btnPrimary}`} onClick={onExportCSV}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                        Exportar CSV
                    </button>
                    <button className={`${styles.btnAcao} ${styles.btnSecondary}`} onClick={onShareURL}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                        Compartilhar
                    </button>
                </div>

                {/* CAMADAS (Mocked functionality for now) */}
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                        Camadas do Mapa
                    </h3>
                    <div className={styles.layerControl}>
                        {['streets', 'satellite', 'dark'].map(layer => (
                            <button
                                key={layer}
                                className={`${styles.layerBtn} ${activeLayer === layer ? styles.layerBtnActive : ''}`}
                                onClick={() => handleLayerChange(layer)}
                            >
                                {layer.charAt(0).toUpperCase() + layer.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BUSCA DE ESCOLA */}
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        Buscar Local de Votação
                    </h3>
                    <input
                        type="text"
                        className={styles.inputField}
                        placeholder="Digite o nome da escola..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 8px 0' }}>Apenas locais do Estado do Rio de Janeiro</p>
                    {isSearching && <p style={{ fontSize: '12px', color: '#999' }}>Buscando...</p>}
                    {searchResults.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                            {searchResults.map(school => (
                                <li
                                    key={school.id}
                                    onClick={() => handleSelectSchool(school)}
                                    style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '13px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <strong>{school.nome_local}</strong><br />
                                    <span style={{ color: '#666', fontSize: '11px' }}>{school.bairro || school.cidade}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* FOOTER */}
                <div className={styles.footer}>
                    <p style={{ margin: '0 0 4px 0' }}>Fonte: TSE - Base dos Dados</p>
                    <p style={{ margin: 0 }}>Última atualização: 2022</p>
                </div>
            </div>
        </div>
    );
}
