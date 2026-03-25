/* Runs in the outer webview shell and controls the preview iframe.
 * Each update swaps the iframe to a freshly generated paged HTML document,
 * which avoids paged.js reusing stale DOM state across renders. */

(function () {
    'use strict';

    const frame = document.getElementById('preview-frame');
    const statusEl = document.getElementById('status');
    let pendingRestorePage = 0;

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function getCurrentPageIndex() {
        if (!frame || !frame.contentDocument || !frame.contentWindow) return 0;

        const pages = Array.from(frame.contentDocument.querySelectorAll('.pagedjs_page'));
        if (!pages.length) return 0;

        const viewportHeight = frame.contentWindow.innerHeight || 0;
        let bestPage = 0;
        let bestVis = -1;

        for (let i = 0; i < pages.length; i++) {
            const rect = pages[i].getBoundingClientRect();
            const vis = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
            if (vis > bestVis) { bestVis = vis; bestPage = i; }
        }

        return bestPage;
    }

    function scrollToPageIndex(idx) {
        if (!frame || !frame.contentDocument) return;

        const pages = frame.contentDocument.querySelectorAll('.pagedjs_page');
        if (pages[idx]) {
            pages[idx].scrollIntoView({ block: 'start', behavior: 'instant' });
        }
    }

    function updateFrame(html, preservePage) {
        if (!frame) return;

        pendingRestorePage = preservePage ? getCurrentPageIndex() : 0;
        setStatus('rendering...');
        frame.srcdoc = html;
    }

    frame.addEventListener('load', function () {
        setStatus('paginating...');
    });

    window.addEventListener('message', function (e) {
        if (!e.data) return;

        if (e.data.type === 'mdpdf-update') {
            updateFrame(e.data.html, true);
            return;
        }

        if (e.data.type === 'paged-rendered') {
            scrollToPageIndex(pendingRestorePage);
            pendingRestorePage = 0;
            setStatus('ready');
        }
    });

    if (typeof window.__mdpdfInitialHtml === 'string') {
        updateFrame(window.__mdpdfInitialHtml, false);
    }
}());
