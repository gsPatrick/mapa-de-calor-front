'use client';

import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import styles from './intelligence.module.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// ===== ICONS =====
const Icons = {
    close: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
    pie: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
    list: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>,
    trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
};

// ===== RESUMO EXECUTIVO PANEL =====
function ResumoExecutivoPanel({ data, onClose, ano, candidatoNome }) {
    if (!data) return null;

    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <h2>RESUMO EXECUTIVO</h2>
                    <span className={styles.panelSubtitle}>{candidatoNome} • {ano}</span>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>{Icons.close}</button>
            </div>

            <div className={styles.panelContent}>
                <table className={styles.executiveTable}>
                    <thead>
                        <tr>
                            <th>MÉTRICA</th>
                            <th>VALOR {ano}</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.metricas.map((m, i) => (
                            <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                                <td className={styles.metricName}>{m.nome}</td>
                                <td className={styles.metricValue}>{m.valor}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[m.statusColor]}`}>
                                        {m.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ===== DISTRIBUIÇÃO MUNICÍPIOS PANEL =====
function DistribuicaoPanel({ data, onClose, ano, candidatoNome }) {
    if (!data) return null;

    const barOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.raw.toLocaleString('pt-BR')} votos`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#666' },
                grid: { color: '#eee' }
            },
            y: {
                ticks: { color: '#333', font: { size: 11 } },
                grid: { display: false }
            }
        }
    };

    const barData = {
        labels: data.barChart.labels,
        datasets: [{
            data: data.barChart.data,
            backgroundColor: data.barChart.labels.map((_, i) =>
                i === 0 ? '#2c3e50' :
                    i === 1 ? '#f1c40f' :
                        i === 2 ? '#27ae60' :
                            i < 6 ? '#3498db' : '#95a5a6'
            ),
            borderRadius: 4
        }]
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#333',
                    font: { size: 11 },
                    generateLabels: (chart) => {
                        const datasets = chart.data.datasets;
                        return chart.data.labels.map((label, i) => ({
                            text: `${label} (${data.pieChart.percentuais[i]}%)`,
                            fillStyle: data.pieChart.cores[i],
                            hidden: false,
                            index: i
                        }));
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.raw.toLocaleString('pt-BR')} votos (${data.pieChart.percentuais[ctx.dataIndex]}%)`
                }
            }
        }
    };

    const pieData = {
        labels: data.pieChart.labels,
        datasets: [{
            data: data.pieChart.data,
            backgroundColor: data.pieChart.cores,
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <h2>DISTRIBUIÇÃO POR MUNICÍPIOS</h2>
                    <span className={styles.panelSubtitle}>{candidatoNome} • {ano}</span>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>{Icons.close}</button>
            </div>

            <div className={styles.panelContent}>
                <div className={styles.chartsGrid}>
                    <div className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>TOP 15 MUNICÍPIOS - DISTRIBUIÇÃO DE VOTOS {ano}</h3>
                        <div className={styles.barChartWrapper}>
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>CONCENTRAÇÃO POR MUNICÍPIO (Top 6 + Outros)</h3>
                        <div className={styles.pieChartWrapper}>
                            <Pie data={pieData} options={pieOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== TOP 20 LOCAIS PANEL =====
function Top20LocaisPanel({ data, onClose, ano, candidatoNome }) {
    if (!data) return null;

    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                    <h2>TOP 20 LOCAIS DE VOTAÇÃO</h2>
                    <span className={styles.panelSubtitle}>{candidatoNome} • {ano}</span>
                </div>
                <button className={styles.closeBtn} onClick={onClose}>{Icons.close}</button>
            </div>

            <div className={styles.panelContent}>
                <table className={styles.rankingTable}>
                    <thead>
                        <tr>
                            <th>RANK</th>
                            <th>LOCAL DE VOTAÇÃO</th>
                            <th>MUNICÍPIO/ZONA</th>
                            <th>VOTOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.ranking.map((item, i) => (
                            <tr
                                key={i}
                                className={`${i % 2 === 0 ? styles.rowEven : styles.rowOdd} ${i < 3 ? styles.topThree : ''}`}
                            >
                                <td className={styles.rankCell}>
                                    {i < 3 ? (
                                        <span className={`${styles.medal} ${styles[`medal${i + 1}`]}`}>{item.rank}</span>
                                    ) : item.rank}
                                </td>
                                <td className={styles.localName}>{item.local}</td>
                                <td className={styles.municipioZona}>{item.municipioZona}</td>
                                <td className={styles.votosCell}>{item.votos.toLocaleString('pt-BR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ===== MAIN COMPONENT =====
export default function IntelligencePanels({
    activePanel,
    onClose,
    candidatoNumero,
    candidatoNome,
    cargo,
    ano
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!activePanel || !candidatoNumero || !cargo || !ano) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const endpoints = {
                'resumo': 'resumo-executivo',
                'distribuicao': 'distribuicao-municipios',
                'top20': 'top20-locais'
            };

            try {
                const url = `${API_BASE}/api/intelligence/${endpoints[activePanel]}?candidato=${candidatoNumero}&cargo=${encodeURIComponent(cargo)}&ano=${ano}`;
                console.log('🔍 Fetching intelligence:', url);

                const res = await fetch(url);
                if (!res.ok) throw new Error('Erro ao carregar dados');

                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error('Intelligence error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activePanel, candidatoNumero, cargo, ano]);

    if (!activePanel) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            {loading && (
                <div className={styles.loadingPanel}>
                    <div className={styles.spinner}></div>
                    <p>Carregando dados de inteligência...</p>
                </div>
            )}

            {error && (
                <div className={styles.errorPanel}>
                    <p>❌ {error}</p>
                    <button onClick={onClose}>Fechar</button>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    {activePanel === 'resumo' && (
                        <ResumoExecutivoPanel data={data} onClose={onClose} ano={ano} candidatoNome={candidatoNome} />
                    )}
                    {activePanel === 'distribuicao' && (
                        <DistribuicaoPanel data={data} onClose={onClose} ano={ano} candidatoNome={candidatoNome} />
                    )}
                    {activePanel === 'top20' && (
                        <Top20LocaisPanel data={data} onClose={onClose} ano={ano} candidatoNome={candidatoNome} />
                    )}
                </>
            )}
        </div>
    );
}

// Export icons for Sidebar buttons
export { Icons as IntelligenceIcons };
