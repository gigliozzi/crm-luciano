import { useState } from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { LeadModal } from '../components/kanban/LeadModal.jsx';

export default function KanbanPage() {
  const [filters, setFilters] = useState({ q: '', stage: '' });
  const [selected, setSelected] = useState(null);

  const onOpenLead = (lead) => setSelected(lead);
  const close = () => setSelected(null);

  return (
    <div>
      <h1>Kanban de Leads</h1>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Buscar (nome, e-mail, telefone)"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            style={{ minWidth: 240 }}
          />
          <select value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}>
            <option value="">Todas as etapas</option>
            <option value="new">Novo</option>
            <option value="qualifying">Qualificando</option>
            <option value="scheduled">Agendado</option>
            <option value="proposal">Proposta</option>
            <option value="won">Fechado (Ganho)</option>
            <option value="lost">Fechado (Perdido)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <KanbanBoard filters={filters} onOpenLead={onOpenLead} />
      </div>

      {selected && <LeadModal lead={selected} onClose={close} />}
    </div>
  );
}
