import headerPartial from 'fleet/partials/header.html';
import * as account from 'fleet/account';

const header = document.querySelector('header');
const headerTemplate = _.template(headerPartial);

morphdom(
	header,
	headerTemplate()
);

account.init();
