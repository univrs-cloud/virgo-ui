import modulePartial from 'modules/storage/partials/index.html';
import storagePartial from 'modules/storage/partials/storage.html';
import * as storageService from 'modules/storage/services/storage';

const moduleTemplate = _.template(modulePartial);
const storageTemplate = _.template(storagePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#storage');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.storage)) {
		return;
	}
	
	let template = document.createElement('template');
	_.each(state.storage, (pool) => {
		template.innerHTML += storageTemplate({ pool, drives: state.drives, bytes, moment });
	});
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

render({ storage: storageService.getStorage(), drives: storageService.getDrives() });

storageService.subscribe([render]);
