'use client';

import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './sidebar.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// ===== SVG ICONS =====
const Icons = {
    vote: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4" /><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" /><path d="M22 19H2" /></svg>,
    chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
    filter: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>,
    mapPin: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    trending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
    trendingDown: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>,
    trophy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
    target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    layers: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></svg>,
    download: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>,
    share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>,
    search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    chevronLeft: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>,
    chevronRight: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>,
    trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>,
    heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
    zap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    percent: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" x2="5" y1="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>,
    // BI Intelligence Icons
    biChart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
    biPie: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
    biTable: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /></svg>,
};

// ===== INFO TOOLTIP COMPONENT =====
const InfoTooltip = ({ text, children }) => (
    <span className={styles.tooltipWrapper}>
        {children}
        <span className={styles.tooltipIcon}>{Icons.info}</span>
        <span className={styles.tooltipText}>{text}</span>
    </span>
);

// ===== CUSTOM SELECT STYLES =====
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '10px',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(255,255,255,0.2)' : 'none',
        '&:hover': { borderColor: 'rgba(255,255,255,0.3)' },
        minHeight: '42px'
    }),
    menu: (base) => ({
        ...base,
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        zIndex: 100
    }),
    option: (base, state) => ({
        ...base,
        background: state.isSelected ? 'rgba(255,255,255,0.15)' : state.isFocused ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: '#fff',
        cursor: 'pointer',
        padding: '10px 14px',
        fontSize: '13px'
    }),
    singleValue: (base) => ({ ...base, color: '#fff', fontSize: '13px' }),
    placeholder: (base) => ({ ...base, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }),
    input: (base) => ({ ...base, color: '#fff' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({ ...base, color: 'rgba(255,255,255,0.5)' })
};

export default function Sidebar({
    filters,
    setFilters,
    stats,
    onToggleLayer,
    onSchoolSelect,
    onExportCSV,
    onShareURL,
    mapData,
    isCollapsed,
    onToggleCollapse,
    onIntelligenceClick
}) {
    const [activeLayer, setActiveLayer] = useState('streets');
    const [candidatosOptions, setCandidatosOptions] = useState([]);
    const [municipiosOptions, setMunicipiosOptions] = useState([]);
    const [bairrosOptions, setBairrosOptions] = useState([]);
    const [zonasOptions, setZonasOptions] = useState([]);
    const [partidosOptions, setPartidosOptions] = useState([]);
    const [crescimentoData, setCrescimentoData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ===== PERFORMANCE METRICS =====
    const performanceMetrics = useMemo(() => {
        if (!mapData || mapData.length === 0) return null;

        // Heatmap active check
        const hasVotes = mapData.some(p => p.votos > 0);
        const totalVotos = mapData.reduce((acc, p) => acc + (p.votos || 0), 0);

        // Best school (absolute)
        const bestSchoolAbsolute = [...mapData]
            .filter(p => p.votos > 0)
            .sort((a, b) => b.votos - a.votos)[0];

        // Best school (relative - highest %)
        const bestSchoolRelative = [...mapData]
            .filter(p => p.votos > 0 && p.total_local > 0)
            .sort((a, b) => (b.votos / b.total_local) - (a.votos / a.total_local))[0];

        // Best bairro (aggregate)
        const bairroVotes = {};
        mapData.forEach(p => {
            if (p.bairro && p.votos > 0) {
                bairroVotes[p.bairro] = (bairroVotes[p.bairro] || 0) + p.votos;
            }
        });
        const bestBairro = Object.entries(bairroVotes).sort((a, b) => b[1] - a[1])[0];

        return {
            hasVotes,
            totalVotos,
            bestSchoolAbsolute,
            bestSchoolRelative,
            bestBairro: bestBairro ? { nome: bestBairro[0], votos: bestBairro[1] } : null
        };
    }, [mapData]);

    // ===== FETCH OPTIONS =====
    useEffect(() => {
        async function loadOptions() {
            try {
                // Candidatos by year AND cargo
                const resFiltros = await fetch(`${API_BASE}/api/filtros?ano=${filters.ano}&cargo=${encodeURIComponent(filters.cargo)}`);
                const dataFiltros = await resFiltros.json();
                if (Array.isArray(dataFiltros)) {
                    // Filter to only show candidates for the selected cargo
                    const filtered = dataFiltros.filter(c => c.cargo === filters.cargo);
                    setCandidatosOptions(filtered.map(c => ({
                        value: c.candidato_numero,
                        label: `${c.candidato_nome} (${c.partido_sigla})`
                    })));
                }

                // Municipios
                const resMuni = await fetch(`${API_BASE}/api/municipios`);
                const dataMuni = await resMuni.json();
                if (Array.isArray(dataMuni)) {
                    setMunicipiosOptions([
                        { value: '', label: 'Todo o Estado' },
                        ...dataMuni.map(m => ({ value: m, label: m }))
                    ]);
                }

                // Bairros
                const resBairros = await fetch(`${API_BASE}/api/filtros/bairros`);
                const dataBairros = await resBairros.json();
                if (Array.isArray(dataBairros)) {
                    setBairrosOptions([
                        { value: '', label: 'Todos os Bairros' },
                        ...dataBairros.map(b => ({ value: b, label: b }))
                    ]);
                }

                // Zonas
                const resZonas = await fetch(`${API_BASE}/api/filtros/zonas`);
                const dataZonas = await resZonas.json();
                if (Array.isArray(dataZonas)) {
                    setZonasOptions([
                        { value: '', label: 'Todas as Zonas' },
                        ...dataZonas.map(z => ({ value: z, label: `Zona ${z}` }))
                    ]);
                }

                // Partidos
                const resPartidos = await fetch(`${API_BASE}/api/filtros/partidos?ano=${filters.ano}`);
                const dataPartidos = await resPartidos.json();
                if (Array.isArray(dataPartidos)) {
                    setPartidosOptions([
                        { value: '', label: 'Todos os Partidos' },
                        ...dataPartidos.map(p => ({
                            value: p.partido_sigla,
                            label: `${p.partido_sigla} (${parseInt(p.total_candidatos || p.total).toLocaleString()})`
                        }))
                    ]);
                }
            } catch (err) {
                console.error('Error loading options:', err);
            }
        }
        loadOptions();
    }, [filters.ano, filters.cargo]);

    // ===== FETCH CRESCIMENTO =====
    useEffect(() => {
        async function fetchCrescimento() {
            if (!filters.candidatoNumero) {
                setCrescimentoData(null);
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/api/stats/crescimento?candidato=${filters.candidatoNumero}&cargo=${encodeURIComponent(filters.cargo)}`);
                const data = await res.json();
                setCrescimentoData(data);
            } catch (err) {
                console.error("Failed to load crescimento", err);
                setCrescimentoData(null);
            }
        }
        fetchCrescimento();
    }, [filters.candidatoNumero, filters.cargo]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            if (key === 'cargo' || key === 'ano') {
                newFilters.candidatoNumero = null;
            }
            return newFilters;
        });
    };

    const handleLayerChange = (layer) => {
        setActiveLayer(layer);
        onToggleLayer(layer);
    };

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/api/escolas/busca?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setIsSearching(false); }
    };

    const handleClearFilters = () => {
        setFilters(prev => ({
            ...prev, municipio: '', bairro: '', zona: '', partido: '', candidatoNumero: null
        }));
    };

    // ===== CHART DATA =====
    const chartData = {
        labels: stats?.partyDistribution?.slice(0, 5).map(p => p.partido_sigla) || [],
        datasets: [{
            data: stats?.partyDistribution?.slice(0, 5).map(p => p.votos) || [],
            backgroundColor: ['#ffffff', '#e5e5e5', '#cccccc', '#999999', '#666666'],
            borderWidth: 0
        }]
    };

    const chartOptions = {
        plugins: { legend: { display: false } },
        cutout: '70%'
    };

    return (
        <>
            {/* Toggle */}
            <button
                className={`${styles.toggleBtn} ${isCollapsed ? styles.toggleBtnCollapsed : ''}`}
                onClick={onToggleCollapse}
            >
                {isCollapsed ? Icons.chevronRight : Icons.chevronLeft}
            </button>

            <aside className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.logoMark}>RJ</div>
                        <div>
                            <h1 className={styles.headerTitle}>Mapa Eleitoral</h1>
                            <p className={styles.headerSubtitle}>{filters.ano} • {filters.cargo}</p>
                        </div>
                    </div>
                </header>

                <div className={styles.scrollArea}>
                    {/* Heatmap Indicator */}
                    <div className={styles.heatmapIndicator}>
                        <div className={`${styles.indicatorDot} ${performanceMetrics?.hasVotes ? styles.active : ''}`}></div>
                        <span>
                            {performanceMetrics?.hasVotes
                                ? `Mapa ativo • ${performanceMetrics.totalVotos.toLocaleString()} votos`
                                : 'Selecione um candidato para visualizar'
                            }
                        </span>
                    </div>

                    {/* ===== DASHBOARD DE PERFORMANCE ===== */}
                    {performanceMetrics?.hasVotes && (
                        <section className={styles.performanceSection}>
                            <h3 className={styles.sectionTitle}>
                                {Icons.zap}
                                <span>Dashboard de Performance</span>
                            </h3>

                            {/* Crescimento KPI */}
                            {crescimentoData && (
                                <div className={styles.kpiCard}>
                                    <div className={styles.kpiHeader}>
                                        <InfoTooltip text="Diferença de votos entre 2022 e 2018 para o candidato selecionado">
                                            <span>Variação Real</span>
                                        </InfoTooltip>
                                        {crescimentoData.variacao_nominal >= 0 ? Icons.trending : Icons.trendingDown}
                                    </div>
                                    <div className={`${styles.kpiValue} ${crescimentoData.variacao_nominal >= 0 ? styles.positive : styles.negative}`}>
                                        {crescimentoData.variacao_nominal >= 0 ? '+' : ''}
                                        {crescimentoData.variacao_nominal?.toLocaleString()} votos
                                    </div>
                                    <div className={styles.kpiMeta}>
                                        <span className={crescimentoData.crescimento_percentual >= 0 ? styles.positive : styles.negative}>
                                            ({crescimentoData.crescimento_percentual >= 0 ? '+' : ''}
                                            {crescimentoData.crescimento_percentual?.toFixed(1)}%)
                                        </span>
                                        &nbsp;• 2018: {crescimentoData.votos_2018?.toLocaleString()} → 2022: {crescimentoData.votos_2022?.toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {/* Troféus Grid */}
                            <div className={styles.trophyGrid}>
                                {/* Best School Absolute */}
                                {performanceMetrics.bestSchoolAbsolute && (
                                    <div className={styles.trophyCard}>
                                        <div className={styles.trophyIcon}>{Icons.trophy}</div>
                                        <div className={styles.trophyInfo}>
                                            <InfoTooltip text="Escola com maior volume absoluto de votos">
                                                <span className={styles.trophyLabel}>Melhor Escola</span>
                                            </InfoTooltip>
                                            <span className={styles.trophyName}>{performanceMetrics.bestSchoolAbsolute.nome}</span>
                                            <span className={styles.trophyValue}>
                                                {performanceMetrics.bestSchoolAbsolute.votos.toLocaleString()} votos
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Best School Relative */}
                                {performanceMetrics.bestSchoolRelative && (
                                    <div className={styles.trophyCard}>
                                        <div className={styles.trophyIcon}>{Icons.percent}</div>
                                        <div className={styles.trophyInfo}>
                                            <InfoTooltip text="Escola com maior percentual de votos em relação ao total">
                                                <span className={styles.trophyLabel}>Domínio de Bairro</span>
                                            </InfoTooltip>
                                            <span className={styles.trophyName}>{performanceMetrics.bestSchoolRelative.nome}</span>
                                            <span className={styles.trophyValue}>
                                                {((performanceMetrics.bestSchoolRelative.votos / performanceMetrics.bestSchoolRelative.total_local) * 100).toFixed(1)}%
                                                <InfoTooltip text="Market Share: percentual de votos do candidato em relação ao total de votos válidos nesta escola">
                                                    <span> do total</span>
                                                </InfoTooltip>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Coração da Campanha */}
                                {performanceMetrics.bestBairro && (
                                    <div className={styles.trophyCard}>
                                        <div className={styles.trophyIcon}>{Icons.heart}</div>
                                        <div className={styles.trophyInfo}>
                                            <InfoTooltip text="Bairro com maior densidade de votos para o candidato">
                                                <span className={styles.trophyLabel}>Coração da Campanha</span>
                                            </InfoTooltip>
                                            <span className={styles.trophyName}>{performanceMetrics.bestBairro.nome}</span>
                                            <span className={styles.trophyValue}>
                                                {performanceMetrics.bestBairro.votos.toLocaleString()} votos
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>{Icons.vote}</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>
                                    {stats?.totalVotos ? (stats.totalVotos / 1000000).toFixed(2) + 'M' : '—'}
                                </span>
                                <span className={styles.statLabel}>Total Votos</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>{Icons.building}</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats?.totalLocais?.toLocaleString() || '—'}</span>
                                <span className={styles.statLabel}>Locais</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>{Icons.users}</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats?.totalCandidatos?.toLocaleString() || '—'}</span>
                                <span className={styles.statLabel}>Candidatos</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>{Icons.mapPin}</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{stats?.totalZonas || '—'}</span>
                                <span className={styles.statLabel}>Zonas</span>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Reports */}
                    {filters.candidatoNumero && (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{Icons.biChart}<span>Relatórios BI</span></h3>
                            <div className={styles.intelligenceButtons}>
                                <button
                                    className={styles.intelligenceBtn}
                                    onClick={() => onIntelligenceClick?.('resumo')}
                                >
                                    {Icons.biTable}
                                    <span>Resumo Executivo</span>
                                </button>
                                <button
                                    className={styles.intelligenceBtn}
                                    onClick={() => onIntelligenceClick?.('distribuicao')}
                                >
                                    {Icons.biPie}
                                    <span>Por Município</span>
                                </button>
                                <button
                                    className={styles.intelligenceBtn}
                                    onClick={() => onIntelligenceClick?.('top20')}
                                >
                                    {Icons.trophy}
                                    <span>Top 20 Locais</span>
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Top Candidates */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{Icons.trophy}<span>Ranking</span></h3>
                        <div className={styles.candidateList}>
                            {stats?.topCandidates?.slice(0, 3).map((cand, i) => (
                                <div key={i} className={styles.candidateItem}>
                                    <div className={styles.candidateRank}>{i + 1}</div>
                                    <div className={styles.candidateInfo}>
                                        <span className={styles.candidateName}>{cand.candidato_nome}</span>
                                        <span className={styles.candidateParty}>{cand.partido_sigla}</span>
                                    </div>
                                    <div className={styles.candidateVotes}>{(cand.total_votos / 1000).toFixed(0)}K</div>
                                </div>
                            )) || <span className={styles.loading}>Carregando...</span>}
                        </div>
                    </section>

                    {/* Filters */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{Icons.filter}<span>Filtros</span></h3>

                        {/* Ano */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Ano</label>
                            <div className={styles.yearTabs}>
                                <button
                                    onClick={() => handleFilterChange('ano', 2018)}
                                    className={`${styles.yearTab} ${filters.ano === 2018 ? styles.active : ''}`}
                                >2018</button>
                                <button
                                    onClick={() => handleFilterChange('ano', 2022)}
                                    className={`${styles.yearTab} ${filters.ano === 2022 ? styles.active : ''}`}
                                >2022</button>
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
                                value={{ value: filters.cargo, label: filters.cargo.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') }}
                                onChange={(opt) => handleFilterChange('cargo', opt.value)}
                                styles={customSelectStyles}
                            />
                        </div>

                        {/* Município */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Município</label>
                            <Select
                                options={municipiosOptions}
                                placeholder="Todo o Estado"
                                value={municipiosOptions.find(m => m.value === filters.municipio) || null}
                                onChange={(opt) => handleFilterChange('municipio', opt?.value || '')}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>

                        {/* Bairro */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Bairro</label>
                            <Select
                                options={bairrosOptions}
                                placeholder="Todos os Bairros"
                                value={bairrosOptions.find(b => b.value === filters.bairro) || null}
                                onChange={(opt) => handleFilterChange('bairro', opt?.value || '')}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>

                        {/* Zona */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Zona Eleitoral</label>
                            <Select
                                options={zonasOptions}
                                placeholder="Todas as Zonas"
                                value={zonasOptions.find(z => z.value === filters.zona) || null}
                                onChange={(opt) => handleFilterChange('zona', opt?.value || '')}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>

                        {/* Partido */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Partido</label>
                            <Select
                                options={partidosOptions}
                                placeholder="Todos os Partidos"
                                value={partidosOptions.find(p => p.value === filters.partido) || null}
                                onChange={(opt) => handleFilterChange('partido', opt?.value || '')}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>

                        {/* Candidato */}
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Candidato</label>
                            <Select
                                options={candidatosOptions}
                                placeholder="Buscar candidato..."
                                value={candidatosOptions.find(c => String(c.value) === String(filters.candidatoNumero)) || null}
                                onChange={(opt) => handleFilterChange('candidatoNumero', opt?.value || null)}
                                styles={customSelectStyles}
                                isClearable
                            />
                        </div>

                        <button className={styles.clearBtn} onClick={handleClearFilters}>
                            {Icons.trash} Limpar Filtros
                        </button>
                    </section>

                    {/* Party Chart */}
                    {stats?.partyDistribution && stats.partyDistribution.length > 0 && (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>{Icons.chart}<span>Distribuição</span></h3>
                            <div className={styles.chartContainer}>
                                <Doughnut data={chartData} options={chartOptions} />
                                <div className={styles.chartLegend}>
                                    {stats.partyDistribution.slice(0, 5).map((p, i) => (
                                        <div key={i} className={styles.legendItem}>
                                            <div className={styles.legendDot} style={{
                                                background: ['#ffffff', '#e5e5e5', '#cccccc', '#999999', '#666666'][i]
                                            }}></div>
                                            <span>{p.partido_sigla}</span>
                                            <span className={styles.legendValue}>{((p.votos / stats.totalVotos) * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Layers */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{Icons.layers}<span>Camadas</span></h3>
                        <div className={styles.layerButtons}>
                            <button className={`${styles.layerBtn} ${activeLayer === 'streets' ? styles.active : ''}`} onClick={() => handleLayerChange('streets')}>Claro</button>
                            <button className={`${styles.layerBtn} ${activeLayer === 'dark' ? styles.active : ''}`} onClick={() => handleLayerChange('dark')}>Escuro</button>
                            <button className={`${styles.layerBtn} ${activeLayer === 'satellite' ? styles.active : ''}`} onClick={() => handleLayerChange('satellite')}>Satélite</button>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={onExportCSV}>{Icons.download} Exportar</button>
                        <button className={styles.actionBtn} onClick={onShareURL}>{Icons.share} Compartilhar</button>
                    </div>

                    {/* Search */}
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>{Icons.search}<span>Buscar Local</span></h3>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Digite o nome da escola..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchResults.length > 0 && (
                            <div className={styles.searchResults}>
                                {searchResults.slice(0, 5).map((school, i) => (
                                    <div key={i} className={styles.searchItem} onClick={() => {
                                        onSchoolSelect(school);
                                        setSearchTerm('');
                                        setSearchResults([]);
                                    }}>
                                        {school.nome_local}
                                        <span className={styles.searchBairro}>{school.bairro}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <footer className={styles.footer}>Sistema de Inteligência Política • RJ</footer>
            </aside>
        </>
    );
}
