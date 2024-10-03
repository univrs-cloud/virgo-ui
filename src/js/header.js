import headerPartial from '../partials/header.html';
import * as weather from  '../js/weather';
import * as account from  '../js/account';
import * as softwareService from './services/software';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

const render = (state) => {
	let upgrade = state.upgrade;
	morphdom(
		container,
		headerTemplate({ upgrade })
	);
	weather.render({ upgrade });
	account.render({ upgrade });
};

softwareService.subscribe([render]);
