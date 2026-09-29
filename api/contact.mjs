const MAX_BODY_CHARS = 12000;

function setCorsHeaders(res, origin) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (origin && allowedOrigin && origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  return Boolean(origin && allowedOrigin && origin === allowedOrigin);
}

function clean(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function respond(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const isAllowedOrigin = setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    return isAllowedOrigin ? res.status(204).end() : respond(res, 403, { error: 'Origem não autorizada.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return respond(res, 405, { error: 'Método não permitido.' });
  }

  if (!isAllowedOrigin) {
    return respond(res, 403, { error: 'Origem não autorizada.' });
  }

  const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, SENDGRID_TO_EMAIL } = process.env;
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !SENDGRID_TO_EMAIL) {
    return respond(res, 500, { error: 'O serviço de e-mail não está configurado.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (JSON.stringify(body).length > MAX_BODY_CHARS) {
    return respond(res, 413, { error: 'A mensagem excede o tamanho permitido.' });
  }

  // A honeypot preenchida indica submissão automatizada; responda sem enviar e-mail.
  if (clean(body.website, 200)) {
    return respond(res, 200, { message: 'Mensagem recebida.' });
  }

  const name = clean(body.nome, 120);
  const company = clean(body.empresa, 160);
  const email = clean(body.email, 254);
  const phone = clean(body.telefone, 40);
  const service = clean(body.servico, 120);
  const message = clean(body.mensagem, 5000);

  if (!name || !email || !service || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond(res, 400, { error: 'Confira os campos obrigatórios e tente novamente.' });
  }

  const fields = [
    ['Nome', name],
    ['Empresa', company || 'Não informada'],
    ['E-mail', email],
    ['Telefone / WhatsApp', phone || 'Não informado'],
    ['Interesse', service],
    ['Mensagem', message],
  ];
  const text = fields.map(([label, value]) => `${label}:\n${value}`).join('\n\n');
  const html = fields.map(([label, value]) => (
    `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`
  )).join('');

  try {
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: SENDGRID_TO_EMAIL }] }],
        from: { email: SENDGRID_FROM_EMAIL },
        reply_to: { email, name },
        subject: `Novo contato pelo site MPC Solutions: ${service}`,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      return respond(res, 502, { error: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' });
    }

    return respond(res, 200, { message: 'Mensagem enviada com sucesso.' });
  } catch {
    return respond(res, 502, { error: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' });
  }
}
