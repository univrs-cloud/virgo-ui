import mainPartial from 'shell/partials/main.html';

const mainTemplate = _.template(mainPartial);
let container = document.querySelector('main');

morphdom(
	container,
	mainTemplate()
);
