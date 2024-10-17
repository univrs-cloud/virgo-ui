import headerPartial from 'shell/partials/header.html';
import upgradeBodyPartial from 'shell/partials/upgrade_body.html';
import * as account from 'shell/account';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';

const headerTemplate = _.template(headerPartial);
const upgradeBodyTemplate = _.template(upgradeBodyPartial);
let header = document.querySelector('header');
let container = document.querySelector('#upgrade');
let isScrollEventAttached = false;
let shouldScroll = true;

const complete = (event) => {
	if (!event.target.classList.contains('complete')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.completeUpgrade();
};

const renderSerialNumber = (state) => {
	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	systemService.unsubscribe();
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
		morphdom(
			container.querySelector('.steps'),
			upgradeBodyTemplate({ updates: null, upgrade })
		);
		let stepsList = container.querySelector('.steps ul');
		if (!isScrollEventAttached) {
			stepsList.addEventListener('scroll', (event) => {
				shouldScroll = (Math.abs(stepsList.scrollHeight - stepsList.scrollTop - stepsList.clientHeight) < 1);
			});
			isScrollEventAttached = true;
		}
		if (!_.isNull(stepsList) && shouldScroll) {
			stepsList.scrollTop = stepsList.scrollHeight;
		}
		container.classList.remove('d-none');
	}
};

morphdom(
	header,
	headerTemplate({ navigationTemplate: () => {}, isUpgrading: true })
);
_.each(document.querySelectorAll('header .version'), (element) => { element.innerHTML = `v${VERSION}`; });

renderSerialNumber({ system: systemService.getSystem() });
render({ upgrade: softwareService.getUpgrade() });

systemService.subscribe([renderSerialNumber]);
softwareService.subscribeToUpgrade([render]);

account.init();

container.addEventListener('click', complete);
