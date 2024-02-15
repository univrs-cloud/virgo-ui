import headerPartial from '../partials/header.html';

const render = () => {
	const template = _.template(headerPartial);
	morphdom(document.querySelector('header'), template());
};

render();
