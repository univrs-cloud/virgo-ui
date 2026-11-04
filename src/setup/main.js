import headerPartial from 'setup/partials/header.html';
import mainPartial from 'setup/partials/main.html';

const headerTemplate = _.template(headerPartial);
const mainTemplate = _.template(mainPartial);
const header = document.querySelector('header');
const container = document.querySelector('main');

document.body.classList.add('menu-collapsed');

morphdom(
	header,
	headerTemplate()
);

morphdom(
	container,
	mainTemplate()
);
