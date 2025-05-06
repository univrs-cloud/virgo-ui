import modulePartial from 'modules/software_update/partials/index.html';
import emptyPartial from 'modules/software_update/partials/empty.html';
import updatesPartial from 'modules/software_update/partials/updates.html';
import * as softwareService from 'modules/software_update/services/software';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const updatesTemplate = _.template(updatesPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#software-update');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const checkUpdates = (event) => {
	let target = event.target.closest('.check-updates');
	if (_.isNull(target) || target.classList.contains('cursor-default')) {
		return;
	}

	event.preventDefault();
	softwareService.checkUpdates();
};

const upgrade = (event) => {
	if (!isAuthenticated) {
		return;
	}

	if (!event.target.classList.contains('install')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.upgrade();
	location.reload();
};

const render = (state) => {
	if (_.isNull(state.updates)) {
		return;
	}

	let template = document.createElement('template');
	if (_.isEmpty(state.updates)) {
		template.innerHTML = emptyTemplate();
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
container.addEventListener('click', upgrade);

softwareService.subscribe([render]);
