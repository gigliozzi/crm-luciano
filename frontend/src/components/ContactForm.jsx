import { useEffect, useState } from 'react';

const emptyContact = {
  firstName: '',
  lastName: '',
  birthDate: '',
  email: '',
  phone: '',
};

/**
 * Simple reusable form for creating and editing contacts.
 */
export function ContactForm({ initialValues, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyContact);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  const e164Pattern = /^\+\d{8,15}$/; // WhatsApp/Twilio-friendly E.164 (+ and 8-15 digits)

  function formatToE164Typing(value) {
    // Keep only digits; always prefix with '+' while typing
    const digits = String(value).replace(/\D/g, '').slice(0, 15);
    return digits ? `+${digits}` : '';
  }

  useEffect(() => {
    setForm({ ...emptyContact, ...initialValues });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone') {
      const formatted = formatToE164Typing(value);
      setForm((current) => ({ ...current, phone: formatted }));
      if (formatted && !e164Pattern.test(formatted)) {
        setPhoneError('Use o formato +5511999999999 (apenas dígitos).');
      } else {
        setPhoneError(null);
      }
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    // Validate E.164 if phone is provided
    if (form.phone && !e164Pattern.test(form.phone)) {
      setSubmitting(false);
      setPhoneError('Telefone deve estar no formato +5511999999999.');
      return;
    }
    try {
      await onSubmit(form);
      setForm(emptyContact);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao salvar contato.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="firstName">Nome</label>
        <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required />
      </div>
      <div className="form-field">
        <label htmlFor="lastName">Sobrenome</label>
        <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required />
      </div>
      <div className="form-field">
        <label htmlFor="birthDate">Data de Nascimento</label>
        <input id="birthDate" name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required />
      </div>
      <div className="form-field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
      </div>
      <div className="form-field">
        <label htmlFor="phone">Telefone</label>
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder={'+5511999999999'}
          pattern={'^\\+\\d{8,15}$'}
          title={'+código do país + número. Ex: +5521978873621'}
          inputMode="tel"
        />
        {phoneError && <span style={{ color: '#d32f2f', fontSize: '0.85rem' }}>{phoneError}</span>}
      </div>

      {error && <p style={{ color: '#d32f2f' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
        {onCancel && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
