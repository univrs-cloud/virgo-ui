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
		template.innerHTML += updatesTemplate({ updates: state.updates });
	}
	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
};

render({
	checkUpdates: softwareService.getCheckUpdates(),
	updates: softwareService.getUpdates()
});

container.addEventListener('click', upgrade);

softwareService.subscribe([render]);
