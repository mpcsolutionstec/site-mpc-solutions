const MAX_BODY_CHARS = 12000;
const CONTACT_PATH = '/api/contact';

function corsHeaders(origin, env) {
  const headers = new Headers({
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  });

  if (origin && env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN) {
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN);
  }

  return headers;
}

function jsonResponse(payload, status, headers) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders });
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin, env);
    const isAllowedOrigin = Boolean(origin && env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN);

    if (url.pathname !== CONTACT_PATH) {
      return jsonResponse({ error: 'Rota não encontrada.' }, 404, headers);
    }

    if (request.method === 'OPTIONS') {
      return isAllowedOrigin
        ? new Response(null, { status: 204, headers })
        : jsonResponse({ error: 'Origem não autorizada.' }, 403, headers);
    }

    if (request.method !== 'POST') {
      headers.set('Allow', 'POST, OPTIONS');
      return jsonResponse({ error: 'Método não permitido.' }, 405, headers);
    }

    if (!isAllowedOrigin) {
      return jsonResponse({ error: 'Origem não autorizada.' }, 403, headers);
    }

    if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL || !env.SENDGRID_TO_EMAIL) {
      return jsonResponse({ error: 'O serviço de e-mail não está configurado.' }, 500, headers);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_CHARS) {
      return jsonResponse({ error: 'A mensagem excede o tamanho permitido.' }, 413, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Os dados enviados não são válidos.' }, 400, headers);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > MAX_BODY_CHARS) {
      return jsonResponse({ error: 'Os dados enviados não são válidos.' }, 400, headers);
    }

    // A honeypot preenchida indica submissão automatizada; responda sem enviar e-mail.
    if (clean(body.website, 200)) {
      return jsonResponse({ message: 'Mensagem recebida.' }, 200, headers);
    }

    const name = clean(body.nome, 120);
    const company = clean(body.empresa, 160);
    const email = clean(body.email, 254);
    const phone = clean(body.telefone, 40);
    const service = clean(body.servico, 120);
    const message = clean(body.mensagem, 5000);

    if (!name || !email || !service || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Confira os campos obrigatórios e tente novamente.' }, 400, headers);
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
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.SENDGRID_TO_EMAIL }] }],
          from: { email: env.SENDGRID_FROM_EMAIL },
          reply_to: { email, name },
          subject: `Novo contato pelo site MPC Solutions: ${service}`,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (!sendGridResponse.ok) {
        return jsonResponse({ error: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' }, 502, headers);
      }

      return jsonResponse({ message: 'Mensagem enviada com sucesso.' }, 200, headers);
    } catch {
      return jsonResponse({ error: 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.' }, 502, headers);
    }
  },
};
