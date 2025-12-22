'use client';
import { useState, useEffect } from 'react';
import styles from './compareCandidates.module.css';

export default function CompareCandidatesModal({ isOpen, onClose, candidatosOptions, cargo }) {
    const [candidate1, setCandidate1] = useState(null);
    const [candidate2, setCandidate2] = useState(null);
    const [data1, setData1] = useState(null);
    const [data2, setData2] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCandidate1(null);
            setCandidate2(null);
            setData1(null);
            setData2(null);
        }
    }, [isOpen]);

    const fetchCandidateData = async (numero) => {
        const res = await fetch(`https://geral-mapadecalorapi.r954jc.easypanel.host/api/mapa?cargo=${cargo}&numero=${numero}`);
        const data = await res.json();
        const total = data.reduce((acc, curr) => acc + curr.votos, 0);
        const percent = data.reduce((acc, curr) => acc + curr.total_local, 0);
        return {
            votos: total,
            percentual: percent > 0 ? ((total / percent) * 100).toFixed(2) : 0,
            locais: data.length
        };
    };

    const handleCompare = async () => {
        if (!candidate1 || !candidate2) return;
        setLoading(true);
        try {
            const [d1, d2] = await Promise.all([
                fetchCandidateData(candidate1.value),
                fetchCandidateData(candidate2.value)
            ]);
            setData1(d1);
            setData2(d2);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Comparar Candidatos</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.selectRow}>
                        <div className={styles.selectCol}>
                            <label>Candidato 1</label>
                            <select
                                value={candidate1?.value || ''}
                                onChange={(e) => setCandidate1(candidatosOptions.find(c => c.value === e.target.value))}
                            >
                                <option value="">Selecione...</option>
                                {candidatosOptions.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.vs}>VS</div>
                        <div className={styles.selectCol}>
                            <label>Candidato 2</label>
                            <select
                                value={candidate2?.value || ''}
                                onChange={(e) => setCandidate2(candidatosOptions.find(c => c.value === e.target.value))}
                            >
                                <option value="">Selecione...</option>
                                {candidatosOptions.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className={styles.compareBtn} onClick={handleCompare} disabled={!candidate1 || !candidate2 || loading}>
                        {loading ? 'Carregando...' : 'Comparar'}
                    </button>

                    {data1 && data2 && (
                        <div className={styles.results}>
                            <div className={styles.resultCard}>
                                <h3>{candidate1.label}</h3>
                                <p><strong>Votos:</strong> {data1.votos.toLocaleString()}</p>
                                <p><strong>Percentual:</strong> {data1.percentual}%</p>
                                <p><strong>Locais:</strong> {data1.locais}</p>
                            </div>
                            <div className={styles.resultCard}>
                                <h3>{candidate2.label}</h3>
                                <p><strong>Votos:</strong> {data2.votos.toLocaleString()}</p>
                                <p><strong>Percentual:</strong> {data2.percentual}%</p>
                                <p><strong>Locais:</strong> {data2.locais}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
