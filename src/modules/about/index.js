import modulePartial from 'modules/about/partials/index.html';
import aboutPartial from 'modules/about/partials/about.html';
import * as aboutService from 'modules/about/services/about';

const moduleTemplate = _.template(modulePartial);
const aboutTemplate = _.template(aboutPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#about');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.system) || _.isNull(state.memory) || _.isNull(state.drives)) {
		return;
	}
	
	const template = aboutTemplate({
		system: state.system,
		memory: state.memory,
		drives: state.drives,
		VERSION: VERSION,
		prettyBytes
	});
	morphdom(
		row,
		`${template}`
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

aboutService.subscribe([render]);
