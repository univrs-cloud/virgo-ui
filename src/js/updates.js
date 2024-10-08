import badgePartial from '../partials/updates_badge.html';
import updateModal from '../partials/modals/update.html';
import upgradeBodyPartial from '../partials/upgrade_body.html';
import * as softwareService from './services/software';

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
	bootstrap.Tooltip.getInstance(target).hide();
	softwareService.checkUpdates();
};

const render = (state) => {
	let checkUpdates = state.checkUpdates;
	let updates = state.updates;
	morphdom(
		document.querySelector('header .updates'),
		badgeTemplate({ checkUpdates, updates }, {
			onBeforeElUpdated: (fromEl, toEl) => {
				morphdom(fromEl, toEl);
				return false;
			}
		})
	);
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
