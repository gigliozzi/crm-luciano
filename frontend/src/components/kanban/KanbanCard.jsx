import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export function KanbanCard({ lead, onStartDrag, onOpen }) {
  const price = [lead.min_price, lead.max_price].filter(Boolean).join(' - ');
  const place = [lead.city, lead.neighborhood].filter(Boolean).join(' / ');
  const last = lead.last_activity_at ? dayjs(lead.last_activity_at).fromNow() : '—';
  const tags = (lead.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const hasOverdue = lead.overdue_followup;
  const nextFup = lead.next_followup_at ? dayjs(lead.next_followup_at) : null;
  const isStale = lead.stale;

  return (
    <div
      className="card"
      style={{ padding: 12, marginBottom: 8, cursor: 'grab' }}
      draggable
      onDragStart={(e) => onStartDrag(e, lead)}
      onClick={() => onOpen?.(lead)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{lead.name}</strong>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {hasOverdue && (
            <span style={{ background: '#d32f2f', color: '#fff', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem' }}>Follow-up vencido</span>
          )}
          {!hasOverdue && nextFup && (
            <span style={{ background: '#ffb300', color: '#1f1f1f', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem' }}>Follow-up {nextFup.fromNow()}</span>
          )}
          {isStale && (
            <span style={{ background: '#ef5350', color: '#fff', padding: '2px 6px', borderRadius: 6, fontSize: '0.75rem' }}>Sem contato</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: '0.9rem', color: '#444', marginTop: 6 }}>
        {price ? `R$ ${price}` : 'Faixa: —'}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {tags.map((t) => (
          <span key={t} style={{ fontSize: '0.75rem', background: '#eceff1', padding: '2px 6px', borderRadius: 6 }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {lead.phone && (
          <a className="secondary-button" href={`https://wa.me/${String(lead.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
        )}
        {lead.email && (
          <a className="secondary-button" href={`mailto:${lead.email}`}>E-mail</a>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#777' }}>Último contato: {last}</div>
    </div>
  );
}
