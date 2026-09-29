# MPC Solutions — site institucional

Site institucional responsivo, com HTML, CSS e JavaScript, publicado no GitHub Pages.

## Publicar o site

Envie os arquivos para a raiz do repositório e configure o GitHub Pages em **Settings → Pages → Deploy from a branch**, selecionando a branch e a pasta que contém `index.html`.

Site: https://mpcsolutionstec.github.io/site-mpc-solutions

## Formulário de contato com SendGrid e Cloudflare Workers

O site permanece no GitHub Pages. O formulário chama o Worker em `cloudflare/worker.js`, que envia o e-mail pelo SendGrid. A chave do SendGrid fica armazenada como Secret no Cloudflare e nunca deve ser incluída no HTML, JavaScript público ou GitHub.

### Criar e publicar o Worker pelo painel Cloudflare

1. Revogue a chave SendGrid que foi compartilhada na conversa e gere uma nova chave com permissão de envio de e-mail.
2. Abra **Workers & Pages** no painel Cloudflare, escolha **Create application → Create Worker → Deploy** e use um nome como `mpc-contact-api`.
3. Abra o Worker criado e selecione **Edit Code**. Substitua o código de exemplo pelo conteúdo de `cloudflare/worker.js` e clique em **Save and Deploy**.
4. No painel do Worker, abra **Settings → Variables and Secrets → Add** e configure:

   - Tipo **Secret**: `SENDGRID_API_KEY`, com a nova chave.
   - Tipo **Text**: `SENDGRID_FROM_EMAIL`, com um endereço remetente verificado no SendGrid.
   - Tipo **Text**: `SENDGRID_TO_EMAIL`, com `mpcsistema669@gmail.com`.
   - Tipo **Text**: `ALLOWED_ORIGIN`, com `https://mpcsolutionstec.github.io`.

5. Clique em **Deploy** para aplicar as variáveis.
6. Em **Workers & Pages → seu Worker → Settings → Domains & Routes**, confirme que a rota `workers.dev` está habilitada. A URL base aparecerá no Overview ou nessa seção, no formato `https://NOME-DO-WORKER.SUBDOMINIO-DA-CONTA.workers.dev`.
7. A URL da API é a URL base seguida de `/api/contact`. Coloque essa URL em `contact-config.js` na propriedade `window.MPC_CONTACT_API_URL` e publique a alteração no GitHub Pages.

O site do projeto já está permitido em `ALLOWED_ORIGIN`. Se ele usar outro domínio, ajuste essa variável para a origem exata do domínio.

O plano gratuito do Workers inclui até 100.000 requisições por dia. A Cloudflare recomenda `workers.dev` para projetos pessoais ou que não sejam críticos para o negócio; para uso crítico em produção, prefira conectar um domínio próprio ao Worker e verifique os termos e limites vigentes.

## Arquivos principais

- `index.html`, `styles.css` e `script.js`: página principal, estilos e comportamento do site.
- `contact-config.js` e `contact-integration.css`: URL da API de contato e estados do formulário.
- `cloudflare/worker.js`: backend de envio para o SendGrid.
- `produtos/`: páginas de Cota Price, GasWay e OfertaFácil.
- `assets/images/`: logotipo e imagens dos produtos.

## Repositório

https://github.com/mpcsolutionstec/site-mpc-solutions.git
