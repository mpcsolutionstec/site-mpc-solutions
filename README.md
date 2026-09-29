# MPC Solutions — site institucional

Site institucional responsivo, com HTML, CSS e JavaScript, publicado no GitHub Pages.

## Publicar o site

Envie os arquivos para a raiz do repositório e configure o GitHub Pages em **Settings → Pages → Deploy from a branch**, selecionando a branch e a pasta que contém `index.html`.

Site: https://mpcsolutionstec.github.io/site-mpc-solutions

## Formulário de contato com SendGrid

O site continua no GitHub Pages. Como o Pages hospeda somente arquivos estáticos, o envio de e-mail é feito pela função serverless `api/contact.mjs`, hospedada separadamente na Vercel. A chave do SendGrid é lida no servidor e não deve ser incluída neste repositório nem no JavaScript do navegador.

### Configurar o backend na Vercel

1. Revogue no SendGrid a chave que foi compartilhada na conversa e gere uma nova chave com permissão de envio de e-mail.
2. Importe este repositório na Vercel, usando a raiz do repositório como diretório do projeto. A função em `api/contact.mjs` será publicada em `/api/contact`.
3. No SendGrid, verifique o endereço que será usado como remetente.
4. Nas configurações da Vercel, adicione estas variáveis de ambiente e faça um novo deploy:

   - `SENDGRID_API_KEY`: a nova chave do SendGrid.
   - `SENDGRID_FROM_EMAIL`: o endereço remetente verificado no SendGrid.
   - `SENDGRID_TO_EMAIL`: `mpcsistema669@gmail.com`.
   - `ALLOWED_ORIGIN`: `https://mpcsolutionstec.github.io`.

5. Copie a URL de produção do projeto Vercel e coloque-a em `contact-config.js`, acrescentando `/api/contact`. Exemplo: `https://nome-do-projeto.vercel.app/api/contact`.
6. Envie `contact-config.js` ao GitHub para atualizar o site no Pages.

Se o site passar a usar um domínio próprio, atualize `ALLOWED_ORIGIN` com a origem desse domínio e faça novo deploy da função. A chave de API deve permanecer apenas nas variáveis de ambiente da Vercel.

## Arquivos principais

- `index.html`, `styles.css` e `script.js`: página principal, estilos e comportamento do site.
- `contact-config.js` e `contact-integration.css`: URL da função de contato e estados do formulário.
- `api/contact.mjs`: backend de envio para o SendGrid.
- `produtos/`: páginas de Cota Price, GasWay e OfertaFácil.
- `assets/images/`: logotipo e imagens dos produtos.

## Repositório

https://github.com/mpcsolutionstec/site-mpc-solutions.git
