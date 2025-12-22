'use client';
import { useState, useEffect } from 'react';
import styles from './schoolDetails.module.css';

const PARTIES = {
    'PL': { color: '#203562', name: 'Partido Liberal' },
    'PT': { color: '#c92127', name: 'Partido dos Trabalhadores' },
    'PSD': { color: '#f58025', name: 'Partido Social Democrático' },
    'PP': { color: '#005a9c', name: 'Progressistas' },
    'UNIÃO': { color: '#004990', name: 'União Brasil' },
    'PDT': { color: '#d82e2f', name: 'Partido Democrático Trabalhista' },
    'PSOL': { color: '#ffcc00', name: 'Partido Socialismo e Liberdade' },
    'MDB': { color: '#009340', name: 'Movimento Democrático Brasileiro' },
    'REPUBLICANOS': { color: '#005da8', name: 'Republicanos' },
    'PSB': { color: '#ffcc00', name: 'Partido Socialista Brasileiro' },
    'PSDB': { color: '#005a9c', name: 'Partido da Social Democracia Brasileira' },
    'DEFAULT': { color: '#777777', name: 'Outros' }
};

export default function SchoolDetails({ schoolId, onClose, selectedCandidateNum }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('PRESIDENTE');

    const TABS = ['PRESIDENTE', 'GOVERNADOR', 'SENADOR', 'DEPUTADO FEDERAL', 'DEPUTADO ESTADUAL'];

    useEffect(() => {
        if (!schoolId) return;

        async function fetchDetails() {
            setLoading(true);
            try {
                // Fetch with Cargo Param
                const res = await fetch(`https://geral-mapadecalorapi.r954jc.easypanel.host/api/escolas/${schoolId}?cargo=${activeTab}`);
                if (!res.ok) throw new Error('Falha ao buscar escola');
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [schoolId, activeTab]);

    if (!schoolId) return null;

    return (
        <div className={`${styles.drawer} ${schoolId ? styles.open : ''}`}>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>

            {loading && <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <span>Carregando dados...</span>
            </div>}

            {data && (
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div className={styles.headerIcon}>🗳️</div>
                        <div className={styles.headerText}>
                            <h2>{data.details.nome_local}</h2>
                            <p>{data.details.endereco}</p>
                            <span className={styles.bairroTag}>{data.details.bairro}</span>
                        </div>
                    </div>

                    <div className={styles.ranking}>
                        {/* Tabs Navigation */}
                        <div className={styles.tabsContainer}>
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'DEPUTADO FEDERAL' ? 'DEP. FEDERAL' :
                                        tab === 'DEPUTADO ESTADUAL' ? 'DEP. ESTADUAL' :
                                            tab.charAt(0) + tab.slice(1).toLowerCase()} {/* Simple Title Case */}
                                </button>
                            ))}
                        </div>

                        <h3 className={styles.sectionTitle}>🏆 Resultado da Votação ({activeTab})</h3>

                        <div className={styles.list}>
                            {data.ranking && data.ranking.length > 0 ? (
                                data.ranking.map((cand, index) => {
                                    const isSelected = String(cand.candidato_numero) === String(selectedCandidateNum);
                                    const maxVotes = data.ranking[0].total_votos;
                                    const width = (cand.total_votos / maxVotes) * 100;

                                    const partyInfo = PARTIES[cand.partido_sigla] || PARTIES['DEFAULT'];
                                    const showPartySigla = cand.partido_sigla && cand.partido_sigla !== 'N/A';

                                    return (
                                        <div key={index} className={`${styles.item} ${isSelected ? styles.highlight : ''}`}>
                                            <div className={styles.itemHeader}>
                                                <div className={styles.rankBadge}>#{index + 1}</div>
                                                <div className={styles.candidateInfo}>
                                                    <span className={styles.name}>{cand.candidato_nome}</span>
                                                    <span className={styles.partyName} style={{ color: partyInfo.color }}>
                                                        {showPartySigla ? cand.partido_sigla : 'Partido'} - {cand.candidato_numero}
                                                    </span>
                                                </div>
                                                <div className={styles.voteCount}>
                                                    <strong>{cand.total_votos.toLocaleString()}</strong>
                                                    <small>votos</small>
                                                </div>
                                            </div>

                                            <div className={styles.barContainer}>
                                                <div
                                                    className={styles.bar}
                                                    style={{
                                                        width: `${width}%`,
                                                        background: `linear-gradient(90deg, ${partyInfo.color}, ${partyInfo.color}88)`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className={styles.emptyState}>Nenhum voto registrado para este cargo nesta seção.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
