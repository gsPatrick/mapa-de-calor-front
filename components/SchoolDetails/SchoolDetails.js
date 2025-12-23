'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './schoolDetails.module.css';

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// SVG Icons
const Icons = {
    close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
    trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
    mapPin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    building: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>,
    trending: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
    trendingDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>,
    compare: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M21 3 14 10" /><path d="M3 21l7-7" /></svg>,
    calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
    // BI Icons
    biChart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
    biPie: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
    biTable: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /></svg>,
    click: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>,
};

const PARTIES = {
    'PL': '#203562', 'PT': '#c92127', 'PSD': '#f58025', 'PP': '#005a9c',
    'UNIÃO': '#004990', 'PDT': '#d82e2f', 'PSOL': '#ffcc00', 'MDB': '#009340',
    'REPUBLICANOS': '#005da8', 'PSB': '#ffcc00', 'PSDB': '#005a9c',
    'PROS': '#ff6600', 'PTB': '#333333', 'N/A': '#666666'
};

// Extra Icons for minimize
const MinimizeIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>;
const ExpandIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>;

// Tooltip Component
const Tooltip = ({ text, children }) => (
    <span className={styles.tooltipWrapper}>
        {children}
        <span className={styles.tooltipIcon}>{Icons.info}</span>
        <span className={styles.tooltipText}>{text}</span>
    </span>
);

export default function SchoolDetails({ schoolId, onClose, selectedCandidateNum, selectedCargo }) {
    const [data2022, setData2022] = useState(null);
    const [data2018, setData2018] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(selectedCargo || 'PRESIDENTE');
    const [displayYear, setDisplayYear] = useState(2022);
    const [showCompare, setShowCompare] = useState(false);

    // Candidate Intelligence Modal
    const [clickedCandidate, setClickedCandidate] = useState(null);
    const [activeIntelPanel, setActiveIntelPanel] = useState(null);

    // Sidebar minimized state
    const [isMinimized, setIsMinimized] = useState(false);

    const TABS = ['PRESIDENTE', 'GOVERNADOR', 'SENADOR', 'DEPUTADO FEDERAL', 'DEPUTADO ESTADUAL'];

    useEffect(() => {
        if (selectedCargo) setActiveTab(selectedCargo);
    }, [selectedCargo]);

    // Fetch both years data
    useEffect(() => {
        if (!schoolId) return;

        async function fetchAll() {
            setLoading(true);
            try {
                const [res2022, res2018] = await Promise.all([
                    fetch(`${API_BASE}/api/escolas/${schoolId}?cargo=${encodeURIComponent(activeTab)}&ano=2022`),
                    fetch(`${API_BASE}/api/escolas/${schoolId}?cargo=${encodeURIComponent(activeTab)}&ano=2018`)
                ]);

                const [json2022, json2018] = await Promise.all([
                    res2022.ok ? res2022.json() : null,
                    res2018.ok ? res2018.json() : null
                ]);

                setData2022(json2022);
                setData2018(json2018);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [schoolId, activeTab]);

    // Current display data
    const currentData = displayYear === 2022 ? data2022 : data2018;
    const compareData = displayYear === 2022 ? data2018 : data2022;

    // Calculations
    const totalVotos = useMemo(() =>
        currentData?.ranking?.reduce((acc, c) => acc + c.total_votos, 0) || 0
        , [currentData]);

    const compareTotalVotos = useMemo(() =>
        compareData?.ranking?.reduce((acc, c) => acc + c.total_votos, 0) || 0
        , [compareData]);

    // Selected candidate calculations
    const selectedCandidate = useMemo(() =>
        currentData?.ranking?.find(c => String(c.candidato_numero) === String(selectedCandidateNum))
        , [currentData, selectedCandidateNum]);

    const selectedCandidateCompare = useMemo(() =>
        compareData?.ranking?.find(c => String(c.candidato_numero) === String(selectedCandidateNum))
        , [compareData, selectedCandidateNum]);

    const selectedPercent = selectedCandidate && totalVotos > 0
        ? ((selectedCandidate.total_votos / totalVotos) * 100).toFixed(1)
        : null;

    // Gap to leader calculation
    const leader = currentData?.ranking?.[0];
    const selectedRank = currentData?.ranking?.findIndex(c => String(c.candidato_numero) === String(selectedCandidateNum)) ?? -1;
    const gapToLeader = selectedCandidate && leader && selectedRank > 0
        ? leader.total_votos - selectedCandidate.total_votos
        : null;

    if (!schoolId) return null;

    return (
        <div className={`${styles.drawer} ${schoolId ? styles.open : ''} ${isMinimized ? styles.minimized : ''}`}>
            {/* Minimize/Expand Button */}
            <button
                className={styles.minimizeBtn}
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
                {isMinimized ? ExpandIcon : MinimizeIcon}
            </button>
            <button className={styles.closeBtn} onClick={onClose}>{Icons.close}</button>

            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinnerIcon}></div>
                    <span>Carregando dados...</span>
                </div>
            )}

            {currentData && (
                <div className={styles.content}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerIcon}>{Icons.building}</div>
                        <div className={styles.headerText}>
                            <h2>{currentData.details?.nome_local}</h2>
                            <p>{currentData.details?.endereco}</p>
                            <div className={styles.tags}>
                                {currentData.details?.bairro && (
                                    <span className={styles.tag}>{Icons.mapPin} {currentData.details.bairro}</span>
                                )}
                                {currentData.details?.cidade && (
                                    <span className={styles.tag}>{currentData.details.cidade}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Year & Compare Controls */}
                    <div className={styles.controls}>
                        <div className={styles.yearTabs}>
                            <button
                                className={`${styles.yearTab} ${displayYear === 2018 ? styles.active : ''}`}
                                onClick={() => setDisplayYear(2018)}
                            >
                                {Icons.calendar} 2018
                            </button>
                            <button
                                className={`${styles.yearTab} ${displayYear === 2022 ? styles.active : ''}`}
                                onClick={() => setDisplayYear(2022)}
                            >
                                {Icons.calendar} 2022
                            </button>
                        </div>
                        <button
                            className={`${styles.compareBtn} ${showCompare ? styles.active : ''}`}
                            onClick={() => setShowCompare(!showCompare)}
                        >
                            {Icons.compare}
                            {showCompare ? 'Ocultar' : 'Comparar'}
                        </button>
                    </div>

                    {/* Comparison Mode */}
                    {showCompare && (
                        <div className={styles.comparisonPanel}>
                            <h4 className={styles.compTitle}>
                                {Icons.compare}
                                Comparativo {displayYear} vs {displayYear === 2022 ? 2018 : 2022}
                            </h4>
                            <div className={styles.compGrid}>
                                <div className={styles.compCard}>
                                    <span className={styles.compYear}>{displayYear}</span>
                                    <span className={styles.compValue}>{totalVotos.toLocaleString()}</span>
                                    <span className={styles.compLabel}>votos totais</span>
                                </div>
                                <div className={styles.compVs}>
                                    {totalVotos > compareTotalVotos ? Icons.trending : Icons.trendingDown}
                                </div>
                                <div className={styles.compCard}>
                                    <span className={styles.compYear}>{displayYear === 2022 ? 2018 : 2022}</span>
                                    <span className={styles.compValue}>{compareTotalVotos.toLocaleString()}</span>
                                    <span className={styles.compLabel}>votos totais</span>
                                </div>
                            </div>
                            <div className={styles.compDiff}>
                                Variação:
                                <strong className={(totalVotos - compareTotalVotos) >= 0 ? styles.positive : styles.negative}>
                                    {(totalVotos - compareTotalVotos) >= 0 ? ' +' : ' '}
                                    {(totalVotos - compareTotalVotos).toLocaleString()} votos
                                </strong>
                            </div>
                        </div>
                    )}

                    {/* Selected Candidate Highlight */}
                    {selectedCandidate && (
                        <div className={styles.candidateHighlight}>
                            <div className={styles.highlightHeader}>
                                <span className={styles.highlightLabel}>Candidato Selecionado</span>
                                <span className={styles.highlightName}>{selectedCandidate.candidato_nome}</span>
                                <span className={styles.highlightParty}>{selectedCandidate.partido_sigla} - {selectedCandidate.candidato_numero}</span>
                            </div>

                            <div className={styles.highlightStats}>
                                <div className={styles.highlightStat}>
                                    <span className={styles.statValue}>{selectedCandidate.total_votos.toLocaleString()}</span>
                                    <span className={styles.statLabel}>votos</span>
                                </div>
                                <div className={styles.highlightDivider}></div>
                                <div className={styles.highlightStat}>
                                    <span className={styles.statValueLarge}>{selectedPercent}%</span>
                                    <Tooltip text="Market Share: percentual de votos em relação ao total da escola">
                                        <span className={styles.statLabel}>do total</span>
                                    </Tooltip>
                                </div>
                                {showCompare && selectedCandidateCompare && (
                                    <>
                                        <div className={styles.highlightDivider}></div>
                                        <div className={styles.highlightStat}>
                                            <span className={`${styles.evolutionValue} ${(selectedCandidate.total_votos - selectedCandidateCompare.total_votos) >= 0 ? styles.positive : styles.negative}`}>
                                                {(selectedCandidate.total_votos - selectedCandidateCompare.total_votos) >= 0 ? '+' : ''}
                                                {(selectedCandidate.total_votos - selectedCandidateCompare.total_votos).toLocaleString()}
                                            </span>
                                            <span className={styles.statLabel}>vs {displayYear === 2022 ? '2018' : '2022'}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Dominio Bar */}
                            <div className={styles.dominioSection}>
                                <div className={styles.dominioHeader}>
                                    <Tooltip text="Barra de Progresso de Domínio: representa o peso do candidato na escola">
                                        <span>Domínio na Escola</span>
                                    </Tooltip>
                                    <span className={styles.dominioPercent}>{selectedPercent}%</span>
                                </div>
                                <div className={styles.dominioBar}>
                                    <div className={styles.dominioFill} style={{ width: `${selectedPercent}%` }}></div>
                                </div>
                            </div>

                            {/* Gap to Leader */}
                            {gapToLeader !== null && gapToLeader > 0 && (
                                <div className={styles.gapAlert}>
                                    {Icons.target}
                                    <span>
                                        Faltam <strong>{gapToLeader.toLocaleString()}</strong> votos para a liderança nesta escola
                                    </span>
                                </div>
                            )}
                            {selectedRank === 0 && (
                                <div className={styles.leaderBadge}>
                                    {Icons.trophy}
                                    <span>Líder nesta escola!</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ranking */}
                    <div className={styles.ranking}>
                        {/* Tabs */}
                        <div className={styles.tabsContainer}>
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'DEPUTADO FEDERAL' ? 'Dep. Federal' :
                                        tab === 'DEPUTADO ESTADUAL' ? 'Dep. Estadual' :
                                            tab.charAt(0) + tab.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>
                                {Icons.trophy}
                                <span>Resultado {displayYear}</span>
                            </h3>
                            <span className={styles.totalVotos}>
                                {Icons.users} {totalVotos.toLocaleString()} votos
                            </span>
                        </div>

                        <div className={styles.list}>
                            {currentData.ranking && currentData.ranking.length > 0 ? (
                                currentData.ranking.map((cand, index) => {
                                    const isSelected = String(cand.candidato_numero) === String(selectedCandidateNum);
                                    const maxVotes = currentData.ranking[0].total_votos;
                                    const width = (cand.total_votos / maxVotes) * 100;
                                    const percent = totalVotos > 0 ? ((cand.total_votos / totalVotos) * 100).toFixed(1) : 0;
                                    const partyColor = PARTIES[cand.partido_sigla] || PARTIES['N/A'];

                                    // Compare data
                                    const candCompare = compareData?.ranking?.find(c => c.candidato_numero === cand.candidato_numero);
                                    const evolution = candCompare ? cand.total_votos - candCompare.total_votos : null;

                                    return (
                                        <div
                                            key={index}
                                            className={`${styles.item} ${isSelected ? styles.highlight : ''} ${styles.clickable}`}
                                            onClick={() => setClickedCandidate(cand)}
                                            title="Clique para ver relatórios de inteligência"
                                        >
                                            <div className={styles.itemHeader}>
                                                <div className={styles.rankBadge} data-rank={index + 1}>
                                                    #{index + 1}
                                                </div>
                                                <div className={styles.candidateInfo}>
                                                    <span className={styles.name}>{cand.candidato_nome}</span>
                                                    <span className={styles.partyName} style={{ color: partyColor }}>
                                                        {cand.partido_sigla} - {cand.candidato_numero}
                                                    </span>
                                                </div>
                                                <div className={styles.voteCount}>
                                                    <strong>{cand.total_votos.toLocaleString()}</strong>
                                                    <small>{percent}%</small>
                                                    {showCompare && evolution !== null && (
                                                        <span className={`${styles.evolution} ${evolution >= 0 ? styles.positive : styles.negative}`}>
                                                            {evolution >= 0 ? '+' : ''}{evolution.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.barContainer}>
                                                <div
                                                    className={styles.bar}
                                                    style={{
                                                        width: `${width}%`,
                                                        background: isSelected
                                                            ? 'linear-gradient(90deg, #fff, #888)'
                                                            : `linear-gradient(90deg, ${partyColor}, ${partyColor}88)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>Nenhum voto registrado para este cargo em {displayYear}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Candidate Intelligence Modal */}
            {clickedCandidate && (
                <div className={styles.intelOverlay} onClick={(e) => e.target === e.currentTarget && setClickedCandidate(null)}>
                    <div className={styles.intelModal}>
                        <div className={styles.intelHeader}>
                            <div className={styles.intelHeaderInfo}>
                                <h2>{clickedCandidate.candidato_nome}</h2>
                                <span className={styles.intelParty}>
                                    {clickedCandidate.partido_sigla} - {clickedCandidate.candidato_numero}
                                </span>
                            </div>
                            <button className={styles.intelClose} onClick={() => setClickedCandidate(null)}>
                                {Icons.close}
                            </button>
                        </div>

                        <div className={styles.intelContent}>
                            {/* Performance KPIs */}
                            <div className={styles.intelKpis}>
                                <div className={styles.intelKpi}>
                                    <span className={styles.intelKpiValue}>
                                        {clickedCandidate.total_votos.toLocaleString()}
                                    </span>
                                    <span className={styles.intelKpiLabel}>Votos nesta Escola</span>
                                </div>
                                <div className={styles.intelKpi}>
                                    <span className={styles.intelKpiValue}>
                                        {totalVotos > 0 ? ((clickedCandidate.total_votos / totalVotos) * 100).toFixed(1) : 0}%
                                    </span>
                                    <span className={styles.intelKpiLabel}>Market Share Local</span>
                                </div>
                                {showCompare && compareData?.ranking && (() => {
                                    const candComp = compareData.ranking.find(c => c.candidato_numero === clickedCandidate.candidato_numero);
                                    const evolution = candComp ? clickedCandidate.total_votos - candComp.total_votos : 0;
                                    return (
                                        <div className={styles.intelKpi}>
                                            <span className={`${styles.intelKpiValue} ${evolution >= 0 ? styles.positive : styles.negative}`}>
                                                {evolution >= 0 ? '+' : ''}{evolution.toLocaleString()}
                                            </span>
                                            <span className={styles.intelKpiLabel}>vs {displayYear === 2022 ? 2018 : 2022}</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* BI Reports Section */}
                            <div className={styles.intelReports}>
                                <h3 className={styles.intelReportsTitle}>
                                    {Icons.biChart}
                                    <span>Relatórios de Inteligência</span>
                                </h3>
                                <p className={styles.intelReportsDesc}>
                                    Selecione um relatório para análise detalhada do candidato no estado do RJ:
                                </p>
                                <div className={styles.intelButtons}>
                                    <button
                                        className={styles.intelBtn}
                                        onClick={() => {
                                            setActiveIntelPanel('resumo');
                                            setIsMinimized(true);
                                            window.dispatchEvent(new CustomEvent('openIntelligence', {
                                                detail: { panel: 'resumo', candidato: clickedCandidate.candidato_numero, cargo: activeTab, ano: displayYear }
                                            }));
                                        }}
                                    >
                                        {Icons.biTable}
                                        <div className={styles.intelBtnText}>
                                            <strong>Resumo Executivo</strong>
                                            <small>Métricas consolidadas e KPIs</small>
                                        </div>
                                    </button>
                                    <button
                                        className={styles.intelBtn}
                                        onClick={() => {
                                            setActiveIntelPanel('distribuicao');
                                            setIsMinimized(true);
                                            window.dispatchEvent(new CustomEvent('openIntelligence', {
                                                detail: { panel: 'distribuicao', candidato: clickedCandidate.candidato_numero, cargo: activeTab, ano: displayYear }
                                            }));
                                        }}
                                    >
                                        {Icons.biPie}
                                        <div className={styles.intelBtnText}>
                                            <strong>Distribuição por Município</strong>
                                            <small>Gráficos de barras e pizza</small>
                                        </div>
                                    </button>
                                    <button
                                        className={styles.intelBtn}
                                        onClick={() => {
                                            setActiveIntelPanel('top20');
                                            setIsMinimized(true);
                                            window.dispatchEvent(new CustomEvent('openIntelligence', {
                                                detail: { panel: 'top20', candidato: clickedCandidate.candidato_numero, cargo: activeTab, ano: displayYear }
                                            }));
                                        }}
                                    >
                                        {Icons.trophy}
                                        <div className={styles.intelBtnText}>
                                            <strong>Top 20 Locais</strong>
                                            <small>Ranking das melhores escolas</small>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
