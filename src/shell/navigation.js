import navigationPartial from 'shell/partials/navigation.html';
import page from 'page';

const navigationTemplate = _.template(navigationPartial);
let container = document.querySelector('header');

const showPage = (href) => {
	_.each(container.querySelectorAll('.nav-link.active'), (element) => { element.classList.remove('active'); });
	_.each(container.querySelectorAll(`.nav-link[href="/${href}"]`), (element) => { element.classList.add('active'); });

	_.each(document.querySelectorAll('.modules > div'), (element) => { element.classList.add('d-none') });
	document.querySelector(`#${href}`)?.classList.remove('d-none');
};

const navigate = (event) => {
	let navLink = event.target.closest('.nav-link');
	if (_.isNull(navLink)) {
		return;
	}

	let offcanvas = navLink.closest('.offcanvas');
	if (!_.isNull(offcanvas)) {
		bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
	}
};

page('/', () => { showPage('dashboard'); });
page('/dashboard', () => { showPage('dashboard'); });
if (isAuthenticated && isAdmin) {
	page('/apps', () => { showPage('apps'); });
	page('/bookmarks', () => { showPage('bookmarks'); });
	page('/folders', () => { showPage('folders'); });
	page('/time-machines', () => { showPage('time-machines'); });
	page('/users', () => { showPage('users'); });
	page('/storage', () => { showPage('storage'); });
	page('/network', () => { showPage('network'); });
	page('/settings', () => { showPage('settings'); });
	page('/software-update', () => { showPage('software-update'); });
	page('/about', () => { showPage('about'); });
}
if (isAuthenticated) {
	page('/users/profile', () => { showPage('profile'); });
}
page('*', () => { showPage('not-found'); });

container.addEventListener('click', navigate);

export {
	navigationTemplate as template
};
