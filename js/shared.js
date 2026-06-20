/* ============================================================
   SHARED.JS
   Runs on every page: mobile nav toggle, active link highlight,
   dynamic footer year.
   ============================================================ */

(function () {
    'use strict';

    /**
     * Highlight the nav link matching the current page.
     */
    function setActiveNavLink() {
        const links = document.querySelectorAll('.nav__links a[data-page]');
        const current = document.body.getAttribute('data-page');

        links.forEach(function (link) {
            if (link.getAttribute('data-page') === current) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    /**
     * Wire up the mobile hamburger toggle.
     */
    function setupMobileNav() {
        const toggle = document.querySelector('.nav__toggle');
        const links = document.querySelector('.nav__links');

        if (!toggle || !links) return;

        toggle.addEventListener('click', function () {
            const isOpen = links.classList.toggle('is-open');
            toggle.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        // Close menu after a link is tapped (mobile UX)
        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                links.classList.remove('is-open');
                toggle.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /**
     * Stamp the current year into the footer automatically.
     */
    function setFooterYear() {
        const yearEl = document.getElementById('footerYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        setActiveNavLink();
        setupMobileNav();
        setFooterYear();
    });
})();
