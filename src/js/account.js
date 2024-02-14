import accountPartial from '../partials/account.html';

const render = () => {
	const template = _.template(accountPartial);
	morphdom(document.querySelector('#account'), template());
};

render();
