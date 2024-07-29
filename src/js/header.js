import headerPartial from '../partials/header.html';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

morphdom(
	container,
	headerTemplate()
);
