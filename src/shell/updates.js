import badgePartial from 'shell/partials/updates_badge.html';
import updateModal from 'shell/partials/modal/update.html';
import upgradeBodyPartial from 'shell/partials/upgrade_body.html';
import * as softwareService from 'shell/services/software';

document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);

const badgeTemplate = _.template(badgePartial);
const upgradeBodyTemplate = _.template(upgradeBodyPartial);
let container = document.querySelector('header');
let modal = document.querySelector('#update');

const upgrade = (event) => {
	event.preventDefault();
	if (!isAuthenticated) {
		return;
	}

	event.target.disabled = true;
	softwareService.upgrade();
	bootstrap.Modal.getInstance(modal)?.hide();
	location.reload();
};

const checkUpdates = (event) => {
	let target = event.target.closest('.check-updates');
	if (_.isNull(target) || target.classList.contains('cursor-default')) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(target)?.hide();
	softwareService.checkUpdates();
};

const render = (state) => {
	let checkUpdates = state.checkUpdates;
	let updates = state.updates;
	_.each(document.querySelectorAll('header .updates'), (element) => {
		morphdom(
			element,
			badgeTemplate({ checkUpdates, updates })
		);
	});
	modal.querySelector('.modal-body').innerHTML = upgradeBodyTemplate({ updates, upgrade: null });
};

const init = () => {
	render({
		checkUpdates: softwareService.getCheckUpdates(),
		updates: softwareService.getUpdates() //[{ package: 'package 1', version: { installed: '1.0.0', upgradableTo: '2.0.0' } }]
	});

	container.addEventListener('click', checkUpdates);
	modal.querySelector('.modal-footer .install').addEventListener('click', upgrade);

	softwareService.subscribeToUpdates([render]);
};

export {
	init
};
