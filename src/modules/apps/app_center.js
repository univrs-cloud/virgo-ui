import appCenterModalPartial from 'modules/apps/partials/modals/app_center.html';
import itemPartial from 'modules/apps/partials/modals/app_center_item.html';
import * as appCenterService from 'modules/apps/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModalPartial);

const itemTemplate = _.template(itemPartial);
let modal = document.querySelector('#app-center');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.tab-content');
let rowExplore = container.querySelector('#app-center-explore .row');
let rowInstalled = container.querySelector('#app-center-installed .row');

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	let templateInstallable = document.createElement('template');
	let installable = _.filter(state.templates, { isInstalled: false });
	templateInstallable.innerHTML = _.join(_.map(installable, (app) => {
		let jobs = _.filter(state.jobs, (job) => { return job.name === 'app:install' && job.data.config.id === app.id && job.progress?.state === 'active'; });
		return itemTemplate({ app, jobs });
	}), '');
	
	let templateInstalled = document.createElement('template');
	let installed = _.filter(state.templates, { isInstalled: true });
	templateInstalled.innerHTML = _.join(_.map(installed, (app) => {
		return itemTemplate({ app, jobs: [] });
	}), '');

	modal.querySelector('.count-explore').innerHTML = _.size(installable);
	modal.querySelector('.count-installed').innerHTML = _.size(installed);

	morphdom(
		rowExplore,
		`<div>${templateInstallable.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	morphdom(
		rowInstalled,
		`<div>${templateInstalled.innerHTML}</div>`,
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
	rowExplore.innerHTML = '';
	rowInstalled.innerHTML = '';
	container.classList.add('d-none');
	loading.classList.remove('d-none');
});
