import headerPartial from '../partials/header.html';
import * as updates from  './updates';
import * as weather from  './weather';
import * as account from  './account';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

morphdom(
	container,
	headerTemplate({ version: VERSION })
);

updates.init();
weather.init();
account.init();
