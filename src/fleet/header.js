import headerPartial from 'fleet/partials/header.html';
import navigationPartial from 'fleet/partials/navigation.html';
import * as account from 'fleet/account';
import page from 'page';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const header = document.querySelector('header');

const renderNavigation = () => {
	const newNav = `<div>${navigationTemplate({ active: page.current })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			newNav,
			{ childrenOnly: true }
		);
	});
};

morphdom(
	header,
	headerTemplate()
);
renderNavigation();

account.init();
