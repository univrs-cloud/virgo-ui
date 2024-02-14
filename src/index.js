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

axios.get('/api/v1/system')
	.then((response) => {
		document.querySelector('footer .serial-number').innerHTML = `SN:${response.data.serial}`;
	})
	.catch((error) => {
		console.log(error);
	});
