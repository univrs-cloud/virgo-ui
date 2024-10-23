import badgePartial from 'shell/partials/updates_badge.html';
import * as softwareService from 'shell/services/software';

const badgeTemplate = _.template(badgePartial);
let container = document.querySelector('header');

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
};

const init = () => {
	render({
		checkUpdates: softwareService.getCheckUpdates(),
		updates: softwareService.getUpdates()
	});

	container.addEventListener('click', checkUpdates);

	softwareService.subscribeToUpdates([render]);
};

export {
	init
};
