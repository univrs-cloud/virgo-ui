import modulePartial from 'node/modules/system_updates/partials/index.html';
import emptyPartial from 'node/modules/system_updates/partials/empty.html';
import updatesPartial from 'node/modules/system_updates/partials/updates.html';
import upToDateImage from 'assets/img/empty/up-to-date.svg';
import * as softwareService from 'node/modules/system_updates/services/software';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const updatesTemplate = _.template(updatesPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#system-updates');
const loading = module.querySelector('.loading');
const emptyList = module.querySelector('.empty-list');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const checkUpdates = (event) => {
	let target = event.target.closest('.check-updates');
	if (_.isNull(target)) {
		return;
	}
	
	event.preventDefault();
	softwareService.checkUpdates();
};

const update = (event) => {
	if (!isAdmin) {
		return;
	}

	if (!event.target.classList.contains('install')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.update();
};

const render = (state) => {
	if (_.isNull(state.updates)) {
		return;
	}

	const isEmpty = _.isEmpty(state.updates);
	if (isEmpty) {
		morphdom(
			emptyList,
			`<div>${emptyTemplate({ checkUpdates: state.checkUpdates, upToDateImage })}</div>`,
			{ childrenOnly: true }
		);
	} else {
		morphdom(
			row,
			`<div>${updatesTemplate({ checkUpdates: state.checkUpdates, updates: state.updates, hasUpdatingApps: state.hasUpdatingApps })}</div>`,
			{ childrenOnly: true }
		);
	}

	loading.classList.add('d-none');
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
};

module.addEventListener('click', checkUpdates);
container.addEventListener('click', update);

softwareService.subscribe([render]);
