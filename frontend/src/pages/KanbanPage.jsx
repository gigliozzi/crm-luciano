import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';

export default function KanbanPage() {
  return (
    <div>
      <h1>Kanban de Leads (Demo)</h1>
      <div className="card">
        <p>Arraste os cards entre colunas. Os dados estão apenas no navegador (localStorage). Integração com API virá em PRs seguintes.</p>
        <KanbanBoard onMove={(evt) => console.log('move', evt)} />
      </div>
    </div>
  );
}

