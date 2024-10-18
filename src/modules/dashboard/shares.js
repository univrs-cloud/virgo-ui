import smbSharesEmptyPartial from 'modules/dashboard/partials/smb_shares_empty.html';
import timeMachineEmptyPartial from 'modules/dashboard/partials/time_machine_empty.html';
import sharesPartial from 'modules/dashboard/partials/shares.html';
import smbSharePartial from 'modules/dashboard/partials/smb_share.html';
import timeMachinePartial from 'modules/dashboard/partials/time_machine.html';
import * as shareService from 'modules/dashboard/services/share';

const sharesEmptyTemplate = _.template(smbSharesEmptyPartial);
const timeMachineEmptyTemplate = _.template(timeMachineEmptyPartial);
const sharesTemplate = _.template(sharesPartial);
const smbShareTemplate = _.template(smbSharePartial);
const timeMachineTemplate = _.template(timeMachinePartial);
let container = document.querySelector('#shares');

const render = (state) => {
	if (_.isNull(state.shares)) {
		return;
	}

	let template = document.createElement('template');
	template.innerHTML = sharesTemplate();
	
	let smbShares = template.content.querySelector('.smb-shares');
	let smbSharesCollection = _.filter(state.shares, { isTimeMachine: false });
	if (_.isEmpty(smbSharesCollection)) {
		smbShares.insertAdjacentHTML('beforeend', sharesEmptyTemplate());
	} else {
		_.each(smbSharesCollection, (entity) => {
			smbShares.insertAdjacentHTML('beforeend', smbShareTemplate({ entity }));
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
