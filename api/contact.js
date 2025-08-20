// /api/contact.js — Vercel Serverless Function (CommonJS)
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { ad = '', email = '', telefon = '', mesaj = '' } = req.body || {};
  if (!mesaj || (!email && !telefon && !ad)) {
    res.status(400).json({ error: 'Lütfen formu eksiksiz doldurun.' });
    return;
  }

  const SMTP_HOST = process.env.SMTP_HOST || 'mail.htlavas.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
  const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true') === 'true'; // 465:true, 587:false
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const TO_EMAIL  = process.env.TO_EMAIL  || 'arda.aslan@htlavas.com';
  const FROM_EMAIL= process.env.FROM_EMAIL|| SMTP_USER;

  if (!SMTP_USER || !SMTP_PASS) {
    res.status(500).json({ error: 'Sunucu e-posta yapılandırması eksik (SMTP_USER/SMTP_PASS).' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const escape = (s='') => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const subject = `HT Lavaş İletişim Formu — ${ad || email || telefon || 'Yeni Mesaj'}`;
  const text = `Ad: ${ad}\nE-posta: ${email}\nTelefon: ${telefon}\n\nMesaj:\n${mesaj}`;
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
      <h2>HT Lavaş İletişim Formu</h2>
      <p><b>Ad:</b> ${escape(ad)}</p>
      <p><b>E-posta:</b> ${escape(email)}</p>
      <p><b>Telefon:</b> ${escape(telefon)}</p>
      <p><b>Mesaj:</b><br>${escape(mesaj).replace(/\\n/g,'<br>')}</p>
      <hr><p style="color:#6b7280">Bu e-posta Vercel sunucunuzdan otomatik gönderildi.</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      text,
      html,
      replyTo: email || undefined,
    });
    res.status(200).json({ message: 'Mesajınız alındı. En kısa sürede sizinle iletişime geçeceğiz.' });
  } catch (err) {
    console.error('Mail send error:', err);
    res.status(500).json({ error: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
  }
};
