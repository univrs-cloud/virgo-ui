import headerPartial from '../partials/header.html';
import * as weather from  '../js/weather';
import * as account from  '../js/account';
import * as softwareService from './services/software';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

const checkUpdates = (event) => {
	let target = event.target.closest('.check-updates');
	if (_.isNull(target) || target.classList.contains('fa-spin')) {
		return;
	}

	event.preventDefault();
	target.classList.add('fa-spin');
	bootstrap.Tooltip.getInstance(target).hide();
	softwareService.checkUpdates();
};

const render = (state) => {
	let upgrade = state.upgrade;
	morphdom(
		container,
		headerTemplate({ upgrade })
	);
	weather.render({ upgrade });
	account.render({ upgrade });
};

container.addEventListener('click', checkUpdates);

softwareService.subscribe([render]);
