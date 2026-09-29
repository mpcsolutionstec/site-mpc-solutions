const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  const formStatus = document.querySelector('#form-status');
  const submitButton = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const endpoint = window.MPC_CONTACT_API_URL;
    if (!endpoint) {
      formStatus.textContent = 'O formulário está sendo configurado. Entre em contato pelo WhatsApp enquanto isso.';
      formStatus.classList.add('error');
      return;
    }

    formStatus.textContent = 'Enviando sua mensagem…';
    formStatus.classList.remove('error', 'success');
    submitButton.disabled = true;

    try {
      const formData = Object.fromEntries(new FormData(contactForm).entries());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar sua mensagem.');

      formStatus.textContent = 'Mensagem enviada! Nossa equipe entrará em contato em breve.';
      formStatus.classList.add('success');
      contactForm.reset();
    } catch {
      formStatus.textContent = 'Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp.';
      formStatus.classList.add('error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
