import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import * as updates from 'shell/updates';
import * as weather from 'shell/weather';
import * as account from 'shell/account';
import * as systemService from 'shell/services/system';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
let container = document.querySelector('header');

const navigate = (event) => {
	let target = event.target.closest('.nav-link');
	if (_.isNull(target)) {
		return;
	}

	let href = target.getAttribute('href');
	if (href === '#' || _.startsWith(href, '#')) {
		event.preventDefault();
	}

	container.querySelector('#navbar .nav-link.active').classList.remove('active');
	target.classList.add('active');

	if (target.dataset.bsToggle === 'modal') {
		return;
	}

	_.each(document.querySelectorAll('.modules > div'), (element) => { element.classList.add('d-none') });
	document.querySelector(`${href}`)?.classList.remove('d-none');
};

const render = (state) => {
	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

morphdom(
	container,
	headerTemplate({ navigationTemplate: navigationTemplate, isUpgrading: false })
);
_.each(container.querySelectorAll('.version'), (element) => { element.innerHTML = `v${VERSION}`; });

render({ system: systemService.getSystem() });

systemService.subscribe([render]);

updates.init();
weather.init();
account.init();

container.addEventListener('click', navigate);
