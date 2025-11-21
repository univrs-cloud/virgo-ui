import page from 'page';
import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation_update.html';
import updateStepsPartial from 'shell/partials/update_steps.html';
import * as account from 'shell/account';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const updateStepsTemplate = _.template(updateStepsPartial);
const header = document.querySelector('header');
const container = document.querySelector('#update');
let isScrollEventAttached = false;
let shouldScroll = true;

const complete = (event) => {
	if (!event.target.classList.contains('complete')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.completeUpdate();
};

const renderSerialNumber = (state) => {
	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

const render = (state) => {
	let update = state.update;
	if (_.isNull(update)) {
		location.replace('/');
		return;
	}

	document.querySelector('main').classList.add('d-none');
	if (!_.isUndefined(update.state) || !_.isEmpty(update.state)) {
		_.each(container.querySelectorAll(`.state:not(.${update.state})`), (element) => { element.classList.add('d-none'); });
		container.querySelector(`.state.${update.state}`).classList.remove('d-none');
		morphdom(
			container.querySelector('.steps'),
			updateStepsTemplate({ update })
		);
		const stepsList = container.querySelector('.steps ul');
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
	headerTemplate({ navigationTemplate, isUpdating: true })
);

account.init();

container.addEventListener('click', complete);

page('*', (ctx) => {
	if (ctx.path !== '/') {
		page.redirect('/');
	}
});
page.start();

systemService.subscribe([renderSerialNumber]);
softwareService.subscribeToUpdate([render]);
