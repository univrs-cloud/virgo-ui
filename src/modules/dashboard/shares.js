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
const container = document.querySelector('#shares');

const render = (state) => {
	if (_.isNull(state.shares)) {
		return;
	}

	const foldersCollection = _.filter(state.shares, { isTimeMachine: false });
	const foldersRowInner = (_.isEmpty(foldersCollection)
		? foldersEmptyTemplate()
		: _.join(_.map(foldersCollection, (entity) => folderTemplate({ entity })), ''));

	const timeMachineCollection = _.filter(state.shares, { isTimeMachine: true });
	const timeMachinesRowInner = (_.isEmpty(timeMachineCollection)
		? timeMachineEmptyTemplate()
		: _.join(_.map(timeMachineCollection, (entity) => timeMachineTemplate({ entity })), ''));

	const rowSlot = /\s*<div class="row"><\/div>/;
	let html = foldersTemplate();
	html = html.replace(rowSlot, `<div class="row">${foldersRowInner}</div>`);
	html = html.replace(rowSlot, `<div class="row">${timeMachinesRowInner}</div>`);

	morphdom(
		container,
		`<div>${html}</div>`,
		{ childrenOnly: true }
	);
};

shareService.subscribe([render]);
