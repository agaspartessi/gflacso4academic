/* Keep only the closed-drawer tabs clear of Academic's responsive navigation.
 * Boost retains ownership of drawer geometry, state, focus and scrolling.
 */
(function() {
    'use strict';
    const init = function() {
        const page = document.querySelector('#page.drawers');
        if (!page || !page.querySelector('.drawer-toggles')) {
            return;
        }
        const navbar = document.querySelector('.navbar.fixed-top');
        const header = document.querySelector('#page-header');
        let frame = 0;
        let previous = '';
        const update = function() {
            frame = 0;
            if (!window.matchMedia('(min-width: 768px)').matches) {
                page.style.removeProperty('--academic-drawer-toggle-top');
                previous = '';
                return;
            }
            const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            const navBottom = navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
            let top = navBottom + rem;
            if (header) {
                // Breadcrumbs can wrap after a resize, font change or drawer transition.
                header.querySelectorAll('#page-navbar, .breadcrumb').forEach(function(element) {
                    if (element.getClientRects().length) {
                        top = Math.max(top, element.getBoundingClientRect().bottom + .75 * rem);
                    }
                });
                // A title only needs extra clearance when it reaches an edge tab's gutter.
                header.querySelectorAll('.page-header-headings, .header-actions-container').forEach(function(element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.width && (rect.left < 48 || rect.right > window.innerWidth - 48)) {
                        top = Math.max(top, rect.bottom + .75 * rem);
                    }
                });
            }
            const value = Math.ceil(top) + 'px';
            if (value !== previous) {
                page.style.setProperty('--academic-drawer-toggle-top', value);
                previous = value;
            }
        };
        const schedule = function() {
            if (!frame) {
                frame = window.requestAnimationFrame(update);
            }
        };
        // Capture also covers Boost's scrollable #page, not just window scroll.
        document.addEventListener('scroll', schedule, {capture: true, passive: true});
        window.addEventListener('resize', schedule, {passive: true});
        if (window.ResizeObserver) {
            const observer = new ResizeObserver(schedule);
            [navbar, header].filter(Boolean).forEach(function(element) {
                observer.observe(element);
            });
        }
        if (document.fonts) {
            document.fonts.ready.then(schedule);
        }
        schedule();
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, {once: true});
    } else {
        init();
    }
}());
