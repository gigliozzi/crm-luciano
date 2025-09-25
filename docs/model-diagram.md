Resumo do modelo (versão inicial Kanban + SaaS)

Tabelas principais (SQLite)
- tenants(id, name, slug, plan, tz, status, created_at, updated_at)
- users(id, tenant_id, email, password_hash, name, role, is_active, created_at)
- stages(id, tenant_id, key, label, order, wip_limit, is_closed, created_at, updated_at)
- leads(id, tenant_id, name, email, phone, stage, owner_id, source, interest_type, property_type, min_price, max_price, city, neighborhood, next_followup_at, last_contact_at, notes_rich, tags, position, created_at, updated_at)
- lead_properties(id, tenant_id, lead_id, property_ref, label, metadata_json)
- lead_events(id, tenant_id, lead_id, type, payload_json, created_by, created_at)
- attachments(id, tenant_id, lead_id, url, kind, created_by, created_at)
- settings(id, tenant_id, key, value_json, created_at, updated_at)
- subscriptions(id, tenant_id, provider, external_id, plan, status, current_period_end, created_at)

Índices sugeridos
- users(tenant_id)
- stages(tenant_id, order)
- leads(tenant_id, stage, owner_id)
- leads(tenant_id, next_followup_at)
- leads(tenant_id, created_at)
- lead_events(tenant_id, lead_id, created_at)

Observações
- Multi-tenant por `tenant_id` (lógico). Em SQLite, FKs opcionais para simplificar migração.
- `stage` em `leads` referencia `stages.key` (consistência via aplicação; índice cobre consultas).
- Tags armazenadas como string (CSV) por simplicidade no SQLite (pode evoluir para tabela de junção).

