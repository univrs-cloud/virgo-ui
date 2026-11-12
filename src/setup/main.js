import headerPartial from 'setup/partials/header.html';
import mainPartial from 'setup/partials/main.html';
import welcomePartial from 'setup/partials/welcome.html';
import welcomeImage from 'assets/img/illustrations/welcome.svg';

const headerTemplate = _.template(headerPartial);
const mainTemplate = _.template(mainPartial);
const welcomeTemplate = _.template(welcomePartial);
const header = document.querySelector('header');
const container = document.querySelector('main');

document.body.classList.add('menu-collapsed');

morphdom(
	header,
	headerTemplate()
);

morphdom(
	container,
	mainTemplate({ welcome: welcomeTemplate({ welcomeImage }) })
);
