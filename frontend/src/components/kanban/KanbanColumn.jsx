import { KanbanCard } from './KanbanCard.jsx';

export function KanbanColumn({ column, leads, onDragOver, onDrop, onStartDrag, onOpen }) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, column.key)}
      onDrop={(e) => onDrop(e, column.key)}
      style={{
        flex: '1 1 320px',
        minWidth: 280,
        maxWidth: 420,
        boxSizing: 'border-box',
        background: '#f7f9fc',
        border: '1px solid #e1e5ee',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{column.label}</strong>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>{leads.length}</span>
      </div>
      {leads.map((lead) => (
        <KanbanCard key={lead.id} lead={lead} onStartDrag={onStartDrag} onOpen={onOpen} />
      ))}
    </div>
  );
}
