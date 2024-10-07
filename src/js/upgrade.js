import updateModal from '../partials/modals/update.html';
import upgradeBodyPartial from '../partials/upgrade_body.html';
import badgePartial from '../partials/update_badge.html';
import * as softwareService from './services/software';

document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);

const badgeTemplate = _.template(badgePartial);
const upgradeBodyTemplate = _.template(upgradeBodyPartial);
let modal = document.querySelector('#update');
let container = document.querySelector('#upgrade');

const complete = (event) => {
	if (!event.target.classList.contains('complete')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.completeUpgrade();
	location.reload();
};

const render = (state) => {
	if (_.isNull(state.updates)) {
		return;
	}

	let checkUpdates = state.checkUpdates;
	let updates = state.updates;
	let upgrade = state.upgrade;

	morphdom(
		document.querySelector('header .updates'),
		badgeTemplate({ checkUpdates, updates, upgrade })
	);
	
	modal.querySelector('.modal-footer .install').classList.toggle('d-none', !_.isNull(upgrade));
	modal.querySelector('.modal-footer .install').disabled = false;

	if (upgrade === false) {
		return;
	}

	if (!_.isNull(upgrade)) {
		_.each(document.querySelectorAll('main, footer .navbar'), (element) => { element.classList.add('d-none'); });
		bootstrap.Modal.getInstance(modal)?.hide();
		if (!_.isUndefined(upgrade.state)) {
			_.each(document.querySelectorAll(`#upgrade .state:not(.${upgrade.state})`), (element) => { element.classList.add('d-none'); });
			document.querySelector(`#upgrade .state.${upgrade.state}`).classList.remove('d-none');
			document.querySelector('#upgrade .steps').innerHTML = upgradeBodyTemplate({ updates, upgrade });
			let stepsList = document.querySelector('#upgrade .steps ul');
			if (!_.isNull(stepsList)) {
				stepsList.scrollTop = stepsList.scrollHeight;
			}
			document.querySelector('#upgrade').classList.remove('d-none');
		}
		return;
	}

	modal.querySelector('.modal-body').innerHTML = upgradeBodyTemplate({ updates, upgrade });
	document.querySelector('#upgrade .steps').innerHTML = '';
	document.querySelector('#upgrade').classList.add('d-none');
	_.each(document.querySelectorAll('#upgrade .state'), (element) => { element.classList.add('d-none') });
	_.each(document.querySelectorAll('main, footer .navbar'), (element) => { element.classList.remove('d-none'); });
};

if (isAuthenticated) {
	const install = (event) => {
		event.preventDefault();
		event.target.disabled = true;
		softwareService.upgrade();
	};

	modal.querySelector('.modal-footer .install').addEventListener('click', install);	
}

container.addEventListener('click', complete);

softwareService.subscribe([render]);
