import foldersEmptyPartial from 'modules/dashboard/partials/folders_empty.html';
import timeMachineEmptyPartial from 'modules/dashboard/partials/time_machine_empty.html';
import foldersPartial from 'modules/dashboard/partials/shares.html';
import folderPartial from 'modules/dashboard/partials/folder.html';
import timeMachinePartial from 'modules/dashboard/partials/time_machine.html';
import * as shareService from 'modules/dashboard/services/share';

const foldersEmptyTemplate = _.template(foldersEmptyPartial);
const timeMachineEmptyTemplate = _.template(timeMachineEmptyPartial);
const foldersTemplate = _.template(foldersPartial);
const folderTemplate = _.template(folderPartial);
const timeMachineTemplate = _.template(timeMachinePartial);
let container = document.querySelector('#shares');

const render = (state) => {
	if (_.isNull(state.shares)) {
		return;
	}

	let template = document.createElement('template');
	template.innerHTML = foldersTemplate();
	
	let folders = template.content.querySelector('.folders');
	let foldersCollection = _.filter(state.shares, { isTimeMachine: false });
	if (_.isEmpty(foldersCollection)) {
		folders.insertAdjacentHTML('beforeend', foldersEmptyTemplate());
	} else {
		_.each(foldersCollection, (entity) => {
			folders.insertAdjacentHTML('beforeend', folderTemplate({ entity }));
		});
	}

	let timeMachines = template.content.querySelector('.time-machines');
	let timeMachineCollection = _.filter(state.shares, { isTimeMachine: true });
	if (_.isEmpty(timeMachineCollection)) {
		timeMachines.insertAdjacentHTML('beforeend', timeMachineEmptyTemplate());
	} else {
		_.each(timeMachineCollection, (entity) => {
			timeMachines.insertAdjacentHTML('beforeend', timeMachineTemplate({ entity }));
		});
	}

	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
};

shareService.subscribe([render]);
