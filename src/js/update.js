import updateModal from '../partials/modals/update.html';
import updateBodyPartial from '../partials/modals/update_body.html';
import badgePartial from '../partials/update_badge.html';
import * as updateService from './services/update';

if (isAuthenticated) {
	document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);
	
	const badgeTemplate = _.template(badgePartial);
	const updateBodyTemplate = _.template(updateBodyPartial);
	let modal = document.querySelector('#update');
	let container = document.querySelector('header');

	const install = (event) => {
		event.preventDefault();
		updateService.upgrade();
	};

	const render = (state) => {
		if (_.isNull(state.updates)) {
			return;
		}

		let updates = state.updates;
		let upgrade = state.upgrade;
		let modalBody = modal.querySelector('.modal-body');
		morphdom(container.querySelector('header .updates'), badgeTemplate({ updates, upgrade }));
		modalBody.innerHTML = updateBodyTemplate({ updates, upgrade });
		if (!_.isNull(upgrade)) {
			modalBody.scrollTop = modalBody.scrollHeight;
		}
		modal.querySelector('.modal-footer .install').classList.toggle('d-none', !_.isNull(upgrade));
	};

	modal.querySelector('.modal-footer .install').addEventListener('click', install);

	updateService.subscribe([render]);
}
