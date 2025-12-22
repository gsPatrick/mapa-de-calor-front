import './globals.css';

export const metadata = {
  title: 'Mapa Eleitoral RJ 2022',
  description: 'Visualização de votos no estado do Rio de Janeiro',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
