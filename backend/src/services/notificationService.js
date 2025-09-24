import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config/env.js';
import { getDb } from '../db/connection.js';

let mailTransporter;
let twilioClient;

function ensureMailTransporter() {
  if (mailTransporter) {
    return mailTransporter;
  }

  if (!config.mail.host || !config.mail.user || !config.mail.pass) {
    console.warn('[mail] Configurações de SMTP ausentes. E-mails serão apenas logados.');
    return null;
  }

  mailTransporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });
  return mailTransporter;
}

function ensureTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.whatsappFrom) {
    console.warn('[twilio] Configurações de WhatsApp ausentes. Mensagens serão apenas logadas.');
    return null;
  }

  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  return twilioClient;
}

export async function sendBirthdayEmail(contact) {
  const transporter = ensureMailTransporter();
  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  const telHref = contact.phone ? `tel:${String(contact.phone).replace(/\s+/g, '')}` : null;
  const mailHref = contact.email ? `mailto:${contact.email}` : null;
  const waHref = contact.phone ? `https://wa.me/${String(contact.phone).replace(/\D/g, '')}` : null;

  const brand = config.brand;
  const headerBg = brand.headerBg;
  const headerText = brand.headerText;
  const actionPrimary = brand.actionPrimary;
  const actionSecondary = brand.actionSecondary;
  const actionWhatsapp = brand.actionWhatsapp;
  const logoImg = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="max-height:40px;display:block;" />`
    : `<strong style=\"font-size:18px;\">${brand.name}</strong>`;

  const footerLines = [
    brand.footerText,
    brand.website && `Website: <a href="${brand.website}" style="color:${actionSecondary};text-decoration:none;">${brand.website}</a>`,
    brand.phone && `Telefone: ${brand.phone}`,
    brand.address && `Endereço: ${brand.address}`,
  ].filter(Boolean).join(' • ');

  const html = `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Lembrete de Aniversário</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f7fb;font-family:Segoe UI,Arial,sans-serif;color:#222;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.08);overflow:hidden;">
              <tr>
                <td style="background:${headerBg};color:${headerText};padding:16px 24px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    ${logoImg}
                    <div>
                      <h1 style="margin:0;font-size:18px;color:${headerText};">🎉 Lembrete de Aniversário</h1>
                      <p style="margin:6px 0 0;font-size:12px;opacity:.9;">${brand.name}</p>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 12px;font-size:16px;">Hoje é aniversário de:</p>
                  <h2 style="margin:0 0 8px;font-size:22px;color:${brand.primaryColor};">${fullName}</h2>
                  <p style="margin:0 0 16px;font-size:14px;color:#444;">
                    Telefone: <strong>${contact.phone || 'não informado'}</strong><br/>
                    E-mail: <strong>${contact.email || 'não informado'}</strong>
                  </p>

                  <div style="margin:18px 0;">
                    ${telHref ? `<a href="${telHref}" style="display:inline-block;margin:4px 6px;padding:10px 14px;background:${actionPrimary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">Ligar agora</a>` : ''}
                    ${mailHref ? `<a href="${mailHref}" style="display:inline-block;margin:4px 6px;padding:10px 14px;background:${actionSecondary};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">Enviar e-mail</a>` : ''}
                    ${waHref ? `<a href="${waHref}" style="display:inline-block;margin:4px 6px;padding:10px 14px;background:${actionWhatsapp};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">Abrir WhatsApp</a>` : ''}
                  </div>

                  <p style="margin:24px 0 0;font-size:12px;color:#666;">Dica: registre seu contato no CRM após o atendimento.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f0f3f7;color:#666;padding:16px 24px;font-size:12px;">
                  <span>${footerLines}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const message = {
    from: config.mail.from || 'crm@example.com',
    to: config.mail.to,
    subject: `Lembrete: Aniversário de ${fullName}`,
    text: `Hoje é aniversário de ${fullName}. Telefone: ${contact.phone || 'não informado'}, e-mail: ${contact.email || 'não informado'}.`,
    html,
  };

  // Anti-duplicidade por dia/canal
  const db = await getDb();
  const already = await db.get(
    `SELECT 1 FROM notification_logs
     WHERE contact_id = ? AND kind = ? AND channel = 'email'
       AND log_date = strftime('%Y-%m-%d','now','localtime')`,
    contact.id,
    'birthday_T-3'
  );
  if (already) {
    console.log(`[mail] Ignorando envio duplicado para contato ${contact.id}`);
    return;
  }

  if (!transporter) {
    console.log('[mail] Simulação de envio', message);
    await db.run(
      `INSERT OR IGNORE INTO notification_logs (contact_id, kind, channel, log_date, info)
       VALUES (?, ?, 'email', strftime('%Y-%m-%d','now','localtime'), ?)`,
      contact.id,
      'birthday_T-3',
      `simulado`
    );
    return;
  }

  await transporter.sendMail(message);
  await db.run(
    `INSERT OR IGNORE INTO notification_logs (contact_id, kind, channel, log_date, info)
     VALUES (?, ?, 'email', strftime('%Y-%m-%d','now','localtime'), ?)`,
    contact.id,
    'birthday_T-3',
    `to=${config.mail.to}`
  );
}

export async function sendBirthdayWhatsapp(contact) {
  const client = ensureTwilioClient();
  const body = `🎉 Lembrete: Hoje é aniversário de ${contact.first_name} ${contact.last_name}!`;

  const db = await getDb();
  const already = await db.get(
    `SELECT 1 FROM notification_logs
     WHERE contact_id = ? AND kind = ? AND channel = 'whatsapp'
       AND log_date = strftime('%Y-%m-%d','now','localtime')`,
    contact.id,
    'birthday_T-3'
  );
  if (already) {
    console.log(`[twilio] Ignorando envio duplicado para contato ${contact.id}`);
    return;
  }

  if (!client || !config.twilio.whatsappTo) {
    console.log('[twilio] Simulação de envio', { body });
    await db.run(
      `INSERT OR IGNORE INTO notification_logs (contact_id, kind, channel, log_date, info)
       VALUES (?, ?, 'whatsapp', strftime('%Y-%m-%d','now','localtime'), ?)`,
      contact.id,
      'birthday_T-3',
      `simulado`
    );
    return;
  }

  await client.messages.create({
    from: `whatsapp:${config.twilio.whatsappFrom}`,
    to: `whatsapp:${config.twilio.whatsappTo}`,
    body,
  });
  await db.run(
    `INSERT OR IGNORE INTO notification_logs (contact_id, kind, channel, log_date, info)
     VALUES (?, ?, 'whatsapp', strftime('%Y-%m-%d','now','localtime'), ?)`,
    contact.id,
    'birthday_T-3',
    `to=${config.twilio.whatsappTo}`
  );
}

export async function dispatchBirthdayNotifications(contacts) {
  for (const contact of contacts) {
    try {
      await sendBirthdayEmail(contact);
      await sendBirthdayWhatsapp(contact);
    } catch (error) {
      console.error('Falha ao enviar lembrete para contato', contact.id, error.message);
    }
  }
}
