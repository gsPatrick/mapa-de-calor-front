'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

// Map Pin Icon
const MapIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('mapaeleitoral_token');
        if (token) {
            fetch(`${API_BASE}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.valid) {
                        router.push('/mapa');
                    } else {
                        localStorage.removeItem('mapaeleitoral_token');
                        localStorage.removeItem('mapaeleitoral_user');
                        setCheckingAuth(false);
                    }
                })
                .catch(() => setCheckingAuth(false));
        } else {
            setCheckingAuth(false);
        }
    }, [router]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, senha: formData.senha })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Credenciais inválidas');
            }

            if (data.token) {
                localStorage.setItem('mapaeleitoral_token', data.token);
                localStorage.setItem('mapaeleitoral_user', JSON.stringify(data.user));
            }

            setSuccess('Login realizado com sucesso!');
            setTimeout(() => {
                router.push('/mapa');
            }, 600);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingBox}>
                    <div className={styles.spinner}></div>
                    <span>Verificando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>{MapIcon}</div>
                        <h1>Mapa Eleitoral RJ</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Sistema de Inteligência Política
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="senha">Senha</label>
                        <input
                            type="password"
                            id="senha"
                            name="senha"
                            value={formData.senha}
                            onChange={handleChange}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className={styles.error}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className={styles.success}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className={styles.spinner}></span>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
            </div>

            <p className={styles.footer}>
                Sistema de Inteligência Geográfica • Rio de Janeiro
            </p>
        </div>
    );
}
