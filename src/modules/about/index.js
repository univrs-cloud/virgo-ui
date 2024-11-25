import modulePartial from 'modules/about/partials/index.html';
import aboutPartial from 'modules/about/partials/about.html';
import * as aboutService from 'modules/about/services/about';
import prettyBytes from 'pretty-bytes';

const moduleTemplate = _.template(modulePartial);
const aboutTemplate = _.template(aboutPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#about');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.system) || _.isNull(state.memory) || _.isNull(state.drives)) {
		return;
	}
	
	let template = aboutTemplate({
		system: state.system,
		memory: state.memory,
		drives: state.drives,
		VERSION: VERSION,
		bytes,
		prettyBytes
	});
	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template}</div>`,
		{ childrenOnly: true }
	);
};

render({ system: aboutService.getSystem(), memory: aboutService.getMemory(), drives: aboutService.getDrives() });

aboutService.subscribe([render]);
