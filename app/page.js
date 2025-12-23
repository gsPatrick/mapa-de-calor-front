'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = 'https://geral-mapadecalorapi.r954jc.easypanel.host';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('mapaeleitoral_token');

    if (token) {
      // Verify token is still valid
      fetch(`${API_BASE}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            // Token valid - go to map
            router.push('/mapa');
          } else {
            // Token invalid - clear and go to login
            localStorage.removeItem('mapaeleitoral_token');
            localStorage.removeItem('mapaeleitoral_user');
            router.push('/login');
          }
        })
        .catch(() => {
          // Error - go to login
          router.push('/login');
        });
    } else {
      // No token - go to login
      router.push('/login');
    }
  }, [router]);

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
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗳️</div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
          Mapa Eleitoral RJ
        </h1>
        <p style={{ opacity: 0.7 }}>Carregando...</p>
      </div>
    </div>
  );
}
