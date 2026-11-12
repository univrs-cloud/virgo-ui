import modulePartial from 'node/modules/system_updates/partials/index.html';
import emptyPartial from 'node/modules/system_updates/partials/empty.html';
import updatesPartial from 'node/modules/system_updates/partials/updates.html';
import updatesListPartial from 'node/modules/system_updates/partials/updates_list.html';
import upToDateImage from 'assets/img/illustrations/up-to-date.svg';
import * as softwareService from 'node/modules/system_updates/services/software';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const updatesTemplate = _.template(updatesPartial);
const updatesListTemplate = _.template(updatesListPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#system-updates');
const loading = module.querySelector('.loading');
const emptyList = module.querySelector('.empty-list');
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
	if (!isAdmin) {
		return;
	}

	if (!event.target.classList.contains('install')) {
		return;
	}

	event.preventDefault();
	event.target.disabled = true;
	softwareService.update();
};

const syncChangelogsToggle = () => {
	const toggle = container.querySelector('.changelogs-toggle');
	if (_.isNull(toggle)) {
		return;
	}

	const changelogs = container.querySelectorAll('.changelog');
	const isExpanded = _.every(changelogs, (changelog) => { return changelog.classList.contains('show'); });
	toggle.setAttribute('aria-expanded', String(isExpanded));
	toggle.querySelector('.expand-label').classList.toggle('d-none', isExpanded);
	toggle.querySelector('.collapse-label').classList.toggle('d-none', !isExpanded);
};

const toggleChangelogs = (event) => {
	const target = event.target.closest('.changelogs-toggle');
	if (_.isNull(target)) {
		return;
	}

	event.preventDefault();
	const isExpanded = (target.getAttribute('aria-expanded') !== 'true');
	_.each(container.querySelectorAll('.changelog'), (changelog) => {
		changelog.classList.toggle('show', isExpanded);
	});
	_.each(container.querySelectorAll('.changelog-toggle'), (toggle) => {
		toggle.setAttribute('aria-expanded', String(isExpanded));
	});
	syncChangelogsToggle();
};

const render = (state) => {
	if (_.isNull(state.updates)) {
		return;
	}

	const checkUpdatesButton = container.querySelector('.check-updates');
	if (!state.checkUpdates && !_.isNull(checkUpdatesButton)) {
		bootstrap.Tooltip.getInstance(checkUpdatesButton)?.hide();
	}

	const isEmpty = _.isEmpty(state.updates);
	if (isEmpty) {
		morphdom(
			emptyList,
			`<div>${emptyTemplate({ checkUpdates: state.checkUpdates, upToDateImage })}</div>`,
			{ childrenOnly: true }
		);
	} else {
		morphdom(
			row,
			`<div>${updatesTemplate({ checkUpdates: state.checkUpdates, updates: state.updates, hasUpdatingApps: state.hasUpdatingApps, updatesListTemplate })}</div>`,
			{
				childrenOnly: true,
				onBeforeElUpdated: (fromEl, toEl) => {
					if (fromEl.classList.contains('details-toggle') && toEl.classList.contains('details-toggle')) {
						toEl.setAttribute('aria-expanded', fromEl.getAttribute('aria-expanded'));
					}
					if (fromEl.classList.contains('collapse') && toEl.classList.contains('collapse')) {
						toEl.classList.toggle('show', fromEl.classList.contains('show'));
					}
				}
			}
		);
		syncChangelogsToggle();
		const checkUpdatesLink = container.querySelector('.check-updates');
		bootstrap.Tooltip.getInstance(checkUpdatesLink)?.setContent({ '.tooltip-inner': checkUpdatesLink.dataset.bsOriginalTitle });
	}

	loading.classList.add('d-none');
	emptyList.classList.toggle('d-none', !isEmpty);
	container.classList.toggle('d-none', isEmpty);
};

module.addEventListener('click', checkUpdates);
container.addEventListener('click', update);
container.addEventListener('click', toggleChangelogs);
container.addEventListener('shown.bs.collapse', syncChangelogsToggle);
container.addEventListener('hidden.bs.collapse', syncChangelogsToggle);

softwareService.subscribe([render]);
