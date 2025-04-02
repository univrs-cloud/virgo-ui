import appCenterModalPartial from 'modules/apps/partials/modal/app_center.html';
import itemPartial from 'modules/apps/partials/modal/app_center_item.html';
import * as appCenterService from 'modules/apps/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModalPartial);

const itemTemplate = _.template(itemPartial);
let modal = document.querySelector('#app-center');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	let template = document.createElement('template');
	template.innerHTML = _.join(_.map(state.templates, (app) => {
		let jobs = _.filter(state.jobs, (job) => { return job.name === 'appInstall' && job.data.config.id === app.id && job.progress?.state === 'active'; });
		return itemTemplate({ app, jobs });
	}), '');

	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

modal.addEventListener('show.bs.modal', () => {
	appCenterService.subscribe([render])
});
modal.addEventListener('hide.bs.modal', () => {
	appCenterService.unsubscribe();
});
modal.addEventListener('hidden.bs.modal', () => {
	row.innerHTML = '';
	container.classList.add('d-none');
	loading.classList.remove('d-none');
});
