import mainPartial from 'shell/partials/main.html';

const container = document.querySelector('main');
const mainTemplate = _.template(mainPartial);

morphdom(
	container,
	mainTemplate()
);
