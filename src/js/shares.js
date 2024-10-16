import smbSharesEmptyPartial from 'partials/smb_shares_empty.html';
import timeMachineEmptyPartial from 'partials/time_machine_empty.html';
import sharesPartial from 'partials/shares.html';
import smbSharePartial from 'partials/smb_share.html';
import timeMachinePartial from 'partials/time_machine.html';
import * as shareService from 'js/services/share';

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

	let timeMachine = template.content.querySelector('.time-machine');
	let timeMachineCollection = _.filter(state.shares, { isTimeMachine: true });
	if (_.isEmpty(timeMachineCollection)) {
		timeMachine.insertAdjacentHTML('beforeend', timeMachineEmptyTemplate());
	} else {
		_.each(timeMachineCollection, (entity) => {
			timeMachine.insertAdjacentHTML('beforeend', timeMachineTemplate({ entity }));
		});
	}

	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
};

shareService.subscribe([render]);
