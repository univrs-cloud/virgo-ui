import headerPartial from 'partials/header_upgrade.html';
import upgradeBodyPartial from 'partials/upgrade_body.html';
import * as softwareService from 'js/services/software';

const headerTemplate = _.template(headerPartial);
const upgradeBodyTemplate = _.template(upgradeBodyPartial);
let header = document.querySelector('header');
let container = document.querySelector('#upgrade');

const complete = (event) => {
	if (!event.target.classList.contains('complete')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.completeUpgrade();
};

const render = (state) => {
	let upgrade = state.upgrade;
	if (_.isNull(upgrade)) {
		location.reload();
		return;
	}

	document.querySelector('main').classList.add('d-none');
	if (!_.isUndefined(upgrade.state) || !_.isEmpty(upgrade.state)) {
		_.each(container.querySelectorAll(`.state:not(.${upgrade.state})`), (element) => { element.classList.add('d-none'); });
		container.querySelector(`.state.${upgrade.state}`).classList.remove('d-none');
		container.querySelector('.steps').innerHTML = upgradeBodyTemplate({ updates: null, upgrade });
		let stepsList = container.querySelector('.steps ul');
		if (!_.isNull(stepsList)) {
			stepsList.scrollTop = stepsList.scrollHeight;
		}
		container.classList.remove('d-none');
	}
};

morphdom(
	header,
	headerTemplate()
);

render({ upgrade: softwareService.getUpgrade() });

container.addEventListener('click', complete);

softwareService.subscribeToUpgrade([render]);
