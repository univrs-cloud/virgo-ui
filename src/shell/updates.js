import badgePartial from 'shell/partials/updates_badge.html';
import * as softwareService from 'shell/services/software';

const badgeTemplate = _.template(badgePartial);
const container = document.querySelector('header');

const checkUpdates = (event) => {
	const target = event.target.closest('.check-updates');
	if (_.isNull(target) || target.classList.contains('cursor-default')) {
		return;
	}

	event.preventDefault();
	bootstrap.Tooltip.getInstance(target)?.hide();
	softwareService.checkUpdates();
};

const render = (state) => {
	const checkUpdates = state.checkUpdates;
	const updates = state.updates;
	_.each(document.querySelectorAll('header .updates'), (element) => {
		morphdom(
			element,
			badgeTemplate({ checkUpdates, updates })
		);
	});
};

const init = () => {
	container.addEventListener('click', checkUpdates);

	softwareService.subscribeToUpdates([render]);
};

export {
	init
};
