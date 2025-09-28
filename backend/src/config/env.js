import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  databaseFile: process.env.DATABASE_FILE || 'data/database.sqlite',
  mail: {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: process.env.SEND_TO || process.env.MAIL_TO || process.env.MAIL_FROM || process.env.MAIL_USER,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
    whatsappTo: process.env.TWILIO_WHATSAPP_TO,
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  phone: {
    defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '',
  },
  brand: {
    name: process.env.BRAND_NAME || 'CRM do Corretor',
    logoUrl: process.env.BRAND_LOGO_URL || '',
    primaryColor: process.env.BRAND_PRIMARY_COLOR || '#0d47a1',
    headerBg: process.env.BRAND_HEADER_BG || '#0d47a1',
    headerText: process.env.BRAND_HEADER_TEXT || '#ffffff',
    actionPrimary: process.env.BRAND_ACTION_PRIMARY || '#0d47a1',
    actionSecondary: process.env.BRAND_ACTION_SECONDARY || '#1976d2',
    actionWhatsapp: process.env.BRAND_ACTION_WHATSAPP || '#25D366',
    footerText: process.env.BRAND_FOOTER_TEXT || 'Enviado automaticamente pelo CRM do Corretor',
    website: process.env.BRAND_WEBSITE || '',
    phone: process.env.BRAND_PHONE || '',
    address: process.env.BRAND_ADDRESS || '',
  },
  sla: {
    staleDays: Number(process.env.SLA_STALE_DAYS || 3),
  },
  defaults: {
    adminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'secret123',
  },
};
