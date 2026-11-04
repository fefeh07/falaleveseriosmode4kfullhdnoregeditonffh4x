(() => {
    const menuButton = document.querySelector('.nav-toggle');
    const navigation = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('main section[id]');
    const yearElement = document.getElementById('current-year');

    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }

    if (menuButton && navigation) {
        const closeMenu = () => {
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Abrir menu');
            navigation.classList.remove('is-open');
        };

        menuButton.addEventListener('click', () => {
            const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', String(!isOpen));
            menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
            navigation.classList.toggle('is-open', !isOpen);
        });

        navLinks.forEach((link) => link.addEventListener('click', closeMenu));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu();
        });
        document.addEventListener('click', (event) => {
            if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
        });
    }

    if ('IntersectionObserver' in window && sections.length && navLinks.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const sectionId = entry.target.id;
                navLinks.forEach((link) => {
                    const isActive = link.getAttribute('href') === `#${sectionId}`;
                    link.classList.toggle('active', isActive);
                    if (isActive) link.setAttribute('aria-current', 'location');
                    else link.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

        sections.forEach((section) => observer.observe(section));
    }
})();