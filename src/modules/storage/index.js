import modulePartial from 'modules/storage/partials/index.html';
import storagePartial from 'modules/storage/partials/storage.html';
import * as storageService from 'modules/storage/services/storage';

const moduleTemplate = _.template(modulePartial);
const storageTemplate = _.template(storagePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#storage');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.storage)) {
		return;
	}
	
	const template = document.createElement('template');
	_.each(state.storage, (pool) => {
		if (pool.name !== 'system') {
			pool.properties.usedbydatasets.percent = (pool.properties.usedbydatasets.value / pool.properties.size.value * 100);
			pool.properties.usedbysnapshots.percent = (pool.properties.usedbysnapshots.value / pool.properties.size.value * 100);
		}
		template.innerHTML += storageTemplate({ pool, drives: state.drives, prettyBytes, moment });
	});
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

storageService.subscribe([render]);
