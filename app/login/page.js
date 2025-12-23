'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
    });

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
            if (!isLogin && formData.senha !== formData.confirmarSenha) {
                throw new Error('As senhas não coincidem');
            }

            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const body = isLogin
                ? { email: formData.email, senha: formData.senha }
                : { nome: formData.nome, email: formData.email, senha: formData.senha };

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar requisição');
            }

            // Save token to localStorage
            if (data.token) {
                localStorage.setItem('mapaeleitoral_token', data.token);
                localStorage.setItem('mapaeleitoral_user', JSON.stringify(data.user));
            }

            if (isLogin) {
                setSuccess('Login realizado com sucesso! Redirecionando...');
                setTimeout(() => {
                    router.push('/admin');
                }, 1500);
            } else {
                setSuccess('Conta criada com sucesso! Faça login para continuar.');
                setTimeout(() => {
                    setIsLogin(true);
                    setFormData(prev => ({ ...prev, nome: '', confirmarSenha: '' }));
                }, 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>🗳️</span>
                        <h1>Mapa Eleitoral RJ</h1>
                    </div>
                    <p className={styles.subtitle}>
                        {isLogin ? 'Acesse o painel administrativo' : 'Crie sua conta'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="nome">Nome Completo</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Digite seu nome"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
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
                            minLength={6}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmarSenha">Confirmar Senha</label>
                            <input
                                type="password"
                                id="confirmarSenha"
                                name="confirmarSenha"
                                value={formData.confirmarSenha}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required={!isLogin}
                            />
                        </div>
                    )}

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
                        ) : isLogin ? (
                            'Entrar'
                        ) : (
                            'Criar Conta'
                        )}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>ou</span>
                </div>

                <button
                    className={styles.switchBtn}
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setSuccess('');
                    }}
                >
                    {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
                </button>

                <a href="/" className={styles.backLink}>
                    ← Voltar ao mapa
                </a>
            </div>

            <p className={styles.footer}>
                Sistema de Inteligência Política • Rio de Janeiro
            </p>
        </div>
    );
}
