import headerPartial from 'partials/header.html';
import navigationPartial from 'partials/navigation.html';
import * as updates from 'js/updates';
import * as weather from 'js/weather';
import * as account from 'js/account';
import * as systemService from 'js/services/system';

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
