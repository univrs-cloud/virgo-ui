import headerPartial from 'partials/header.html';
import * as updates from 'js/updates';
import * as weather from 'js/weather';
import * as account from 'js/account';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

morphdom(
	container,
	headerTemplate({ version: VERSION })
);

updates.init();
weather.init();
account.init();
