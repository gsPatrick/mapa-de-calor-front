'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './admin.module.css';

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// Admin Map Component (simplified version)
const AdminMap = dynamic(() => import('../../components/AdminMap/AdminMap'), {
    ssr: false,
    loading: () => <div className={styles.mapLoading}>Carregando mapa...</div>
});

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);

    // Pontos Estratégicos State
    const [pontos, setPontos] = useState([]);
    const [showPontoModal, setShowPontoModal] = useState(false);
    const [selectedPonto, setSelectedPonto] = useState(null);
    const [pontoForm, setPontoForm] = useState({
        titulo: '',
        descricao: '',
        latitude: '',
        longitude: '',
        tipo_icone: 'star',
        cor: '#FF5722'
    });

    // Locais State
    const [locais, setLocais] = useState([]);
    const [locaisSearch, setLocaisSearch] = useState('');
    const [locaisPage, setLocaisPage] = useState(1);
    const [locaisPagination, setLocaisPagination] = useState({ total: 0, totalPages: 1 });
    const [showLocalModal, setShowLocalModal] = useState(false);
    const [selectedLocal, setSelectedLocal] = useState(null);

    // Check Authentication
    useEffect(() => {
        const token = localStorage.getItem('mapaeleitoral_token');
        const userData = localStorage.getItem('mapaeleitoral_user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (!['admin', 'editor'].includes(parsedUser.role)) {
            alert('Acesso negado. Permissão insuficiente.');
            router.push('/');
            return;
        }

        setUser(parsedUser);
        setLoading(false);
    }, [router]);

    // Get Auth Headers
    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('mapaeleitoral_token')}`
    });

    // Fetch Admin Stats
    useEffect(() => {
        if (!user) return;

        async function fetchStats() {
            try {
                const res = await fetch(`${API_BASE}/api/admin/stats`, {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Erro ao buscar estatísticas:', err);
            }
        }
        fetchStats();
    }, [user]);

    // Fetch Pontos Estratégicos
    useEffect(() => {
        if (!user || activeTab !== 'pontos') return;
        fetchPontos();
    }, [user, activeTab]);

    async function fetchPontos() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/pontos?all=true`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setPontos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Erro ao buscar pontos:', err);
        }
    }

    // Fetch Locais
    useEffect(() => {
        if (!user || activeTab !== 'locais') return;
        fetchLocais();
    }, [user, activeTab, locaisPage, locaisSearch]);

    async function fetchLocais() {
        try {
            const params = new URLSearchParams({
                page: locaisPage,
                limit: 20,
                search: locaisSearch
            });
            const res = await fetch(`${API_BASE}/api/admin/locais?${params}`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setLocais(data.data || []);
            setLocaisPagination(data.pagination || { total: 0, totalPages: 1 });
        } catch (err) {
            console.error('Erro ao buscar locais:', err);
        }
    }

    // Handle Ponto Submit
    async function handlePontoSubmit(e) {
        e.preventDefault();
        try {
            const method = selectedPonto ? 'PUT' : 'POST';
            const url = selectedPonto
                ? `${API_BASE}/api/admin/pontos/${selectedPonto.id}`
                : `${API_BASE}/api/admin/pontos`;

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(pontoForm)
            });

            if (!res.ok) throw new Error('Erro ao salvar ponto');

            setShowPontoModal(false);
            setSelectedPonto(null);
            setPontoForm({
                titulo: '',
                descricao: '',
                latitude: '',
                longitude: '',
                tipo_icone: 'star',
                cor: '#FF5722'
            });
            fetchPontos();
        } catch (err) {
            alert(err.message);
        }
    }

    // Handle Ponto Delete
    async function handlePontoDelete(id) {
        if (!confirm('Deseja desativar este ponto?')) return;
        try {
            await fetch(`${API_BASE}/api/admin/pontos/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            fetchPontos();
        } catch (err) {
            alert('Erro ao deletar ponto');
        }
    }

    // Handle Local Update
    async function handleLocalUpdate(e) {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/admin/locais/${selectedLocal.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(selectedLocal)
            });

            if (!res.ok) throw new Error('Erro ao atualizar local');

            setShowLocalModal(false);
            setSelectedLocal(null);
            fetchLocais();
        } catch (err) {
            alert(err.message);
        }
    }

    // Handle Map Click (for adding points)
    const handleMapClick = (lat, lng) => {
        setPontoForm(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
        }));
        setShowPontoModal(true);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('mapaeleitoral_token');
        localStorage.removeItem('mapaeleitoral_user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Verificando autenticação...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarLogo}>🗳️</span>
                    <h2>Admin Panel</h2>
                </div>

                <nav className={styles.sidebarNav}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Dashboard
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'pontos' ? styles.active : ''}`}
                        onClick={() => setActiveTab('pontos')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        Pontos Estratégicos
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'locais' ? styles.active : ''}`}
                        onClick={() => setActiveTab('locais')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Locais de Votação
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'mapa' ? styles.active : ''}`}
                        onClick={() => setActiveTab('mapa')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
                        </svg>
                        Adicionar no Mapa
                    </button>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {user?.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user?.nome}</span>
                            <span className={styles.userRole}>{user?.role}</span>
                        </div>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className={styles.dashboard}>
                        <h1 className={styles.pageTitle}>Dashboard</h1>
                        <p className={styles.pageSubtitle}>Visão geral do sistema</p>

                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>🏫</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats?.total_locais?.toLocaleString() || '-'}</span>
                                    <span className={styles.statLabel}>Locais de Votação</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📊</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats?.total_registros_votos?.toLocaleString() || '-'}</span>
                                    <span className={styles.statLabel}>Registros de Votos</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>👥</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats?.total_usuarios || '-'}</span>
                                    <span className={styles.statLabel}>Usuários</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>📍</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{stats?.total_pontos_estrategicos || '-'}</span>
                                    <span className={styles.statLabel}>Pontos Estratégicos</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.statsRow}>
                            <div className={styles.bigStatCard}>
                                <div className={styles.bigStatHeader}>
                                    <span>🗳️ Votos 2022</span>
                                </div>
                                <span className={styles.bigStatValue}>
                                    {stats?.total_votos_2022 ? (stats.total_votos_2022 / 1000000).toFixed(2) + 'M' : '-'}
                                </span>
                            </div>
                            <div className={styles.bigStatCard}>
                                <div className={styles.bigStatHeader}>
                                    <span>🗳️ Votos 2018</span>
                                </div>
                                <span className={styles.bigStatValue}>
                                    {stats?.total_votos_2018 ? (stats.total_votos_2018 / 1000000).toFixed(2) + 'M' : '-'}
                                </span>
                            </div>
                        </div>

                        <a href="/" className={styles.backToMap}>
                            ← Voltar ao Mapa Eleitoral
                        </a>
                    </div>
                )}

                {/* Pontos Estratégicos Tab */}
                {activeTab === 'pontos' && (
                    <div className={styles.tableSection}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h1 className={styles.pageTitle}>Pontos Estratégicos</h1>
                                <p className={styles.pageSubtitle}>Gerencie marcadores customizados no mapa</p>
                            </div>
                            <button
                                className={styles.primaryBtn}
                                onClick={() => {
                                    setSelectedPonto(null);
                                    setPontoForm({
                                        titulo: '',
                                        descricao: '',
                                        latitude: '',
                                        longitude: '',
                                        tipo_icone: 'star',
                                        cor: '#FF5722'
                                    });
                                    setShowPontoModal(true);
                                }}
                            >
                                + Novo Ponto
                            </button>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Tipo</th>
                                        <th>Coordenadas</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pontos.map(ponto => (
                                        <tr key={ponto.id} className={!ponto.ativo ? styles.inactive : ''}>
                                            <td>
                                                <strong>{ponto.titulo}</strong>
                                                {ponto.descricao && <span className={styles.subtext}>{ponto.descricao.substring(0, 50)}...</span>}
                                            </td>
                                            <td>
                                                <span className={styles.iconBadge} style={{ background: ponto.cor }}>
                                                    {ponto.tipo_icone === 'star' ? '⭐' :
                                                        ponto.tipo_icone === 'flag' ? '🚩' :
                                                            ponto.tipo_icone === 'alert' ? '⚠️' : '📍'}
                                                </span>
                                            </td>
                                            <td className={styles.coords}>
                                                {ponto.latitude}, {ponto.longitude}
                                            </td>
                                            <td>
                                                <span className={`${styles.status} ${ponto.ativo ? styles.statusActive : styles.statusInactive}`}>
                                                    {ponto.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => {
                                                            setSelectedPonto(ponto);
                                                            setPontoForm({
                                                                titulo: ponto.titulo,
                                                                descricao: ponto.descricao || '',
                                                                latitude: ponto.latitude,
                                                                longitude: ponto.longitude,
                                                                tipo_icone: ponto.tipo_icone,
                                                                cor: ponto.cor
                                                            });
                                                            setShowPontoModal(true);
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handlePontoDelete(ponto.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Locais de Votação Tab */}
                {activeTab === 'locais' && (
                    <div className={styles.tableSection}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h1 className={styles.pageTitle}>Locais de Votação</h1>
                                <p className={styles.pageSubtitle}>Edite informações das escolas</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar local..."
                                value={locaisSearch}
                                onChange={(e) => {
                                    setLocaisSearch(e.target.value);
                                    setLocaisPage(1);
                                }}
                                className={styles.searchInput}
                            />
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Bairro</th>
                                        <th>Cidade</th>
                                        <th>Coordenadas</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {locais.map(local => (
                                        <tr key={local.id}>
                                            <td>
                                                <strong>{local.nome_local}</strong>
                                                {local.endereco && <span className={styles.subtext}>{local.endereco}</span>}
                                            </td>
                                            <td>{local.bairro || '-'}</td>
                                            <td>{local.cidade || '-'}</td>
                                            <td className={styles.coords}>
                                                {local.latitude ? `${local.latitude}, ${local.longitude}` : '-'}
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => {
                                                        setSelectedLocal({ ...local });
                                                        setShowLocalModal(true);
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className={styles.pagination}>
                            <span>
                                Página {locaisPage} de {locaisPagination.totalPages}
                                ({locaisPagination.total} locais)
                            </span>
                            <div className={styles.paginationBtns}>
                                <button
                                    disabled={locaisPage === 1}
                                    onClick={() => setLocaisPage(p => p - 1)}
                                >
                                    ← Anterior
                                </button>
                                <button
                                    disabled={locaisPage >= locaisPagination.totalPages}
                                    onClick={() => setLocaisPage(p => p + 1)}
                                >
                                    Próximo →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mapa Tab */}
                {activeTab === 'mapa' && (
                    <div className={styles.mapSection}>
                        <div className={styles.mapHeader}>
                            <h1 className={styles.pageTitle}>Adicionar Ponto no Mapa</h1>
                            <p className={styles.pageSubtitle}>Clique no mapa para adicionar um novo ponto estratégico</p>
                        </div>
                        <div className={styles.mapContainer}>
                            <AdminMap onMapClick={handleMapClick} pontos={pontos} />
                        </div>
                    </div>
                )}
            </main>

            {/* Ponto Modal */}
            {showPontoModal && (
                <div className={styles.modalOverlay} onClick={() => setShowPontoModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedPonto ? 'Editar Ponto' : 'Novo Ponto Estratégico'}</h2>
                            <button className={styles.closeModal} onClick={() => setShowPontoModal(false)}>×</button>
                        </div>
                        <form onSubmit={handlePontoSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Título *</label>
                                <input
                                    type="text"
                                    value={pontoForm.titulo}
                                    onChange={e => setPontoForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Descrição</label>
                                <textarea
                                    value={pontoForm.descricao}
                                    onChange={e => setPontoForm(prev => ({ ...prev, descricao: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Latitude *</label>
                                    <input
                                        type="text"
                                        value={pontoForm.latitude}
                                        onChange={e => setPontoForm(prev => ({ ...prev, latitude: e.target.value }))}
                                        placeholder="-22.906847"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Longitude *</label>
                                    <input
                                        type="text"
                                        value={pontoForm.longitude}
                                        onChange={e => setPontoForm(prev => ({ ...prev, longitude: e.target.value }))}
                                        placeholder="-43.172896"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Ícone</label>
                                    <select
                                        value={pontoForm.tipo_icone}
                                        onChange={e => setPontoForm(prev => ({ ...prev, tipo_icone: e.target.value }))}
                                    >
                                        <option value="star">⭐ Estrela</option>
                                        <option value="flag">🚩 Bandeira</option>
                                        <option value="pin">📍 Pin</option>
                                        <option value="alert">⚠️ Alerta</option>
                                        <option value="target">🎯 Alvo</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Cor</label>
                                    <input
                                        type="color"
                                        value={pontoForm.cor}
                                        onChange={e => setPontoForm(prev => ({ ...prev, cor: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowPontoModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.primaryBtn}>
                                    {selectedPonto ? 'Salvar Alterações' : 'Criar Ponto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Local Modal */}
            {showLocalModal && selectedLocal && (
                <div className={styles.modalOverlay} onClick={() => setShowLocalModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Editar Local de Votação</h2>
                            <button className={styles.closeModal} onClick={() => setShowLocalModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleLocalUpdate} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Nome do Local</label>
                                <input
                                    type="text"
                                    value={selectedLocal.nome_local || ''}
                                    onChange={e => setSelectedLocal(prev => ({ ...prev, nome_local: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Endereço</label>
                                <input
                                    type="text"
                                    value={selectedLocal.endereco || ''}
                                    onChange={e => setSelectedLocal(prev => ({ ...prev, endereco: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Bairro</label>
                                    <input
                                        type="text"
                                        value={selectedLocal.bairro || ''}
                                        onChange={e => setSelectedLocal(prev => ({ ...prev, bairro: e.target.value }))}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Cidade</label>
                                    <input
                                        type="text"
                                        value={selectedLocal.cidade || ''}
                                        onChange={e => setSelectedLocal(prev => ({ ...prev, cidade: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Latitude</label>
                                    <input
                                        type="text"
                                        value={selectedLocal.latitude || ''}
                                        onChange={e => setSelectedLocal(prev => ({ ...prev, latitude: e.target.value }))}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Longitude</label>
                                    <input
                                        type="text"
                                        value={selectedLocal.longitude || ''}
                                        onChange={e => setSelectedLocal(prev => ({ ...prev, longitude: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowLocalModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.primaryBtn}>
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
