import modulePartial from 'modules/system_updates/partials/index.html';
import emptyPartial from 'modules/system_updates/partials/empty.html';
import updatesPartial from 'modules/system_updates/partials/updates.html';
import * as softwareService from 'modules/system_updates/services/software';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const updatesTemplate = _.template(updatesPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#system-updates');
const loading = module.querySelector('.loading');
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
	if (!isAuthenticated || !isAdmin) {
		return;
	}

	if (!event.target.classList.contains('install')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.update();
	location.reload();
};

const render = (state) => {
	if (_.isNull(state.updates)) {
		return;
	}

	const template = document.createElement('template');
	if (_.isEmpty(state.updates)) {
		template.innerHTML = emptyTemplate({ checkUpdates: state.checkUpdates });
	} else {
		template.innerHTML += updatesTemplate({ checkUpdates: state.checkUpdates, updates: state.updates });
	}

	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

container.addEventListener('click', checkUpdates);
container.addEventListener('click', update);

softwareService.subscribe([render]);
