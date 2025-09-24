import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div>
      <h1>Página não encontrada</h1>
      <p>A página que você acessou não existe.</p>
      <Link to="/dashboard">Ir para o dashboard</Link>
    </div>
  );
}
