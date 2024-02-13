import './index.scss';
import './js/weather';
import './js/resource_usage';
import './js/services_bookmarks';

bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
_.each(document.querySelectorAll('[data-bs-toggle="tooltip"]'), (element) => {
	new bootstrap.Tooltip(element);
});
