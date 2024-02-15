import mainPartial from '../partials/main.html';

const render = () => {
	const template = _.template(mainPartial);
	morphdom(document.querySelector('main'), template());
};

render();
