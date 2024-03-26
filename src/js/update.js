import badgePartial from '../partials/update_badge.html';
import updateModal from '../partials/modals/update.html';
import updateBody from '../partials/modals/update_body.html';
import * as updateService from './services/update';
import morphdom from 'morphdom';

if (isAuthenticated) {
	document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);
	let modal = document.querySelector('#update');
	let container = document.querySelector('header');

	const install = (event) => {
		event.preventDefault();
		console.log('Installing...');
	};

	const render = (state) => {
		if (_.isNull(state.updates)) {
			return;
		}

		let updates = state.updates;
		morphdom(container.querySelector('header .nav-item.updates'), _.template(badgePartial)({ updates }));
		modal.querySelector('.modal-body').innerHTML = _.template(updateBody)({ updates });
	};

	modal.querySelector('.install').addEventListener('click', install);

	updateService.subscribe([render]);
}
