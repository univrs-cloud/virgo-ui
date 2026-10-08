import copy from 'copy-to-clipboard';
import modulePartial from 'node/modules/about/partials/index.html';
import aboutPartial from 'node/modules/about/partials/about.html';
import * as aboutService from 'node/modules/about/services/about';

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
		networkInterface: _.find(state.system?.networkInterfaces, { default: true }),
		memory: state.memory,
		drives: _.reject(state.drives, 'system'),
		VERSION: VERSION,
		prettyBytes
	});
	morphdom(
		row,
		`<div>${template}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.textContent;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

module.addEventListener('click', copyToClipboard);

aboutService.subscribe([render]);
