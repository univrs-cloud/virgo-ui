import page from 'page';
import headerPartial from 'node/partials/header.html';
import navigationPartial from 'setup/partials/navigation.html';
import mainPartial from 'node/partials/main.html';
import * as systemService from 'node/services/system';

let unsubscribe;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const mainTemplate = _.template(mainPartial);
const header = document.querySelector('header');
const container = document.querySelector('main');

const renderSerialNumber = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	unsubscribe?.();
	unsubscribe = null;
};

const renderNavigation = () => {
	_.each(header.querySelectorAll('.navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			`<div>${navigationTemplate()}</div>`,
			{ childrenOnly: true }
		);
	});
};

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation();

morphdom(
	container,
	mainTemplate()
);

page('*', (ctx) => {
	if (ctx.path !== '/') {
		page.redirect('/');
	}
});
page.start();

unsubscribe = systemService.subscribe([renderSerialNumber]);
