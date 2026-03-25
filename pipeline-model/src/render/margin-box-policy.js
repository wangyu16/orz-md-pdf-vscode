'use strict';

function buildFirstPageMarginCss(settings) {
    if (!settings.firstPageHideHeader && !settings.firstPageHideFooter) {
        return '';
    }

    let inner = '';
    if (settings.firstPageHideHeader) {
        inner += `
            @top-left { content: none; border: none; box-shadow: none; background-image: none; }
            @top-center { content: none; border: none; box-shadow: none; background-image: none; }
            @top-right { content: none; border: none; box-shadow: none; background-image: none; }`;
    }

    if (settings.firstPageHideFooter) {
        inner += `
            @bottom-left { content: none; border: none; box-shadow: none; background-image: none; }
            @bottom-center { content: none; border: none; box-shadow: none; background-image: none; }
            @bottom-right { content: none; border: none; box-shadow: none; background-image: none; }`;
    }

    return inner ? `\n        @page:first {\n            ${inner.trim()}\n        }` : '';
}

function buildPageNumberRuntimeJs(settings) {
    const pageNumberStartPage = Number.isFinite(Number(settings.pageNumberStartPage))
        ? Math.max(1, Math.floor(Number(settings.pageNumberStartPage)))
        : (settings.firstPageSkipNumber ? 2 : 1);

    if (settings.pageNumberPosition === 'none') {
        // Even without page numbers, fill TOC page references
        return `
        (function() {
            var allPages = document.querySelectorAll('.pagedjs_page');
            var preBodySet = [];
            allPages.forEach(function(page) {
                if (page.querySelector('.mdpdf-pre-body, [data-mdpdf-pre-body="1"]')) {
                    preBodySet.push(page);
                }
            });
            document.querySelectorAll('[data-mdpdf-toc-target]').forEach(function(el) {
                var targetId = el.getAttribute('data-mdpdf-toc-target');
                var target = document.getElementById(targetId);
                if (!target) return;
                var targetPage = null;
                allPages.forEach(function(page) { if (!targetPage && page.contains(target)) targetPage = page; });
                if (!targetPage) return;
                var pageIndex = Array.prototype.indexOf.call(allPages, targetPage);
                var preBodyBefore = 0;
                for (var i = 0; i < pageIndex; i++) {
                    if (preBodySet.indexOf(allPages[i]) !== -1) preBodyBefore++;
                }
                var bodyPage = pageIndex + 1 - preBodyBefore;
                el.textContent = bodyPage > 0 ? String(bodyPage) : '';
            });
        })();
        `;
    }

    return `
        (function() {
            var positionToClass = {
                'header-left': 'pagedjs_margin-top-left',
                'header-center': 'pagedjs_margin-top-center',
                'header-right': 'pagedjs_margin-top-right',
                'footer-left': 'pagedjs_margin-bottom-left',
                'footer-center': 'pagedjs_margin-bottom-center',
                'footer-right': 'pagedjs_margin-bottom-right'
            };
            var targetClass = positionToClass['${settings.pageNumberPosition}'];
            var style = '${settings.pageNumberStyle}';
            var allPages = document.querySelectorAll('.pagedjs_page');
            var startPage = ${pageNumberStartPage};

            // Identify pre-body pages (produced by elements with placement: pre-body)
            var preBodySet = [];
            allPages.forEach(function(page) {
                if (page.querySelector('.mdpdf-pre-body, [data-mdpdf-pre-body="1"]')) {
                    preBodySet.push(page);
                }
            });
            var preBodyCount = preBodySet.length;
            var bodyTotal = allPages.length - preBodyCount;
            var total = Math.max(0, bodyTotal - startPage + 1);

            function fmt(n, t) {
                switch (style) {
                    case 'page-n': return 'Page ' + n;
                    case 'page-n-of-N': return 'Page ' + n + ' of ' + t;
                    case 'n-of-N': return n + ' of ' + t;
                    case 'n-slash-N': return n + ' / ' + t;
                    case 'dash-n-dash': return '- ' + n + ' -';
                    case 'brackets': return '[' + n + ']';
                    case 'parentheses': return '(' + n + ')';
                    default: return String(n);
                }
            }

            if (targetClass) {
                var hide = document.createElement('style');
                hide.textContent = '.' + targetClass + ' .pagedjs_margin-content::after { content: none !important; }';
                document.head.appendChild(hide);

                allPages.forEach(function(page, index) {
                    var box = page.querySelector('.' + targetClass + ' .pagedjs_margin-content');
                    if (!box) return;

                    // Pre-body pages: no page number shown
                    if (preBodySet.indexOf(page) !== -1) {
                        box.textContent = '';
                        return;
                    }

                    // Count how many pre-body pages come before this page
                    var preBodyBefore = 0;
                    for (var i = 0; i < index; i++) {
                        if (preBodySet.indexOf(allPages[i]) !== -1) preBodyBefore++;
                    }
                    var bodyPage = index + 1 - preBodyBefore;

                    if (bodyPage < startPage || total === 0) {
                        box.textContent = '';
                        return;
                    }
                    box.textContent = fmt(bodyPage - startPage + 1, total);
                });
            }

            // Fill TOC page number spans (data-mdpdf-toc-target="heading-id")
            document.querySelectorAll('[data-mdpdf-toc-target]').forEach(function(el) {
                var targetId = el.getAttribute('data-mdpdf-toc-target');
                var target = document.getElementById(targetId);
                if (!target) return;
                var targetPage = null;
                allPages.forEach(function(page) { if (!targetPage && page.contains(target)) targetPage = page; });
                if (!targetPage) return;
                var pageIndex = Array.prototype.indexOf.call(allPages, targetPage);
                var preBodyBefore = 0;
                for (var i = 0; i < pageIndex; i++) {
                    if (preBodySet.indexOf(allPages[i]) !== -1) preBodyBefore++;
                }
                var bodyPage = pageIndex + 1 - preBodyBefore;
                el.textContent = bodyPage > 0 ? String(bodyPage) : '';
            });
        })();
    `;
}

function buildPreBodyMarginRuntimeJs(settings) {
    return `
        (function() {
            const hideHeader = ${settings.preBodyHideHeader ? 'true' : 'false'};
            const hideFooter = ${settings.preBodyHideFooter ? 'true' : 'false'};
            const marginSelectors = [];

            if (hideHeader) {
                marginSelectors.push(
                    '.pagedjs_margin-top-left',
                    '.pagedjs_margin-top-center',
                    '.pagedjs_margin-top-right'
                );
            }

            if (hideFooter) {
                marginSelectors.push(
                    '.pagedjs_margin-bottom-left',
                    '.pagedjs_margin-bottom-center',
                    '.pagedjs_margin-bottom-right'
                );
            }

            if (!hideHeader && !hideFooter) {
                return;
            }

            document.querySelectorAll('.pagedjs_page').forEach(function(page) {
                if (!page.querySelector('.mdpdf-pre-body, [data-mdpdf-pre-body="1"]')) {
                    return;
                }

                if (hideHeader) {
                    page.classList.add('mdpdf-hide-margin-boxes-header');
                }
                if (hideFooter) {
                    page.classList.add('mdpdf-hide-margin-boxes-footer');
                }

                marginSelectors.forEach(function(selector) {
                    const box = page.querySelector(selector);
                    if (!box) return;
                    const content = box.querySelector('.pagedjs_margin-content');
                    if (content) {
                        content.textContent = '';
                    }
                });
            });
        })();
    `;
}

module.exports = {
    buildFirstPageMarginCss,
    buildPageNumberRuntimeJs,
    buildPreBodyMarginRuntimeJs,
};