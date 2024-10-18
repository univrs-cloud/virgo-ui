import navigationPartial from 'shell/partials/navigation.html';

const navigationTemplate = _.template(navigationPartial);
let container = document.querySelector('header');

const navigate = (event) => {
	let navLink = event.target.closest('.nav-link');
	if (_.isNull(navLink)) {
		return;
	}

	let offcanvas = navLink.closest('.offcanvas');
	let href = navLink.getAttribute('href');
	if (href === '#' || _.startsWith(href, '#')) {
		event.preventDefault();
	}

	_.each(container.querySelectorAll('.nav-link.active'), (element) => { element.classList.remove('active'); });
	_.each(container.querySelectorAll(`.nav-link[href="${href}"]`), (element) => { element.classList.add('active'); });

	_.each(document.querySelectorAll('.modules > div'), (element) => { element.classList.add('d-none') });
	document.querySelector(`${href}`)?.classList.remove('d-none');

	if (!_.isNull(offcanvas)) {
		bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
	}
};

container.addEventListener('click', navigate);

export {
	navigationTemplate as template
};
