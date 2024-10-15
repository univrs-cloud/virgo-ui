import smbSharesEmptyPartial from 'partials/smb_shares_empty.html';
import timeMachineBackupsEmptyPartial from 'partials/time_machine_backups_empty.html';
import sharesPartial from 'partials/shares.html';
import smbSharePartial from 'partials/smb_share.html';
import timeMachineBackupPartial from 'partials/time_machine_backup.html';
import * as shareService from 'js/services/share';

const sharesEmptyTemplate = _.template(smbSharesEmptyPartial);
const timeMachineNackupsEmptyTemplate = _.template(timeMachineBackupsEmptyPartial);
const sharesTemplate = _.template(sharesPartial);
const smbShareTemplate = _.template(smbSharePartial);
const timeMachineBackupTemplate = _.template(timeMachineBackupPartial);
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

	let timeMachineBackups = template.content.querySelector('.time-machine-backups');
	let timeMachineBackupsCollection = _.filter(state.shares, { isTimeMachine: true });
	if (_.isEmpty(timeMachineBackupsCollection)) {
		timeMachineBackups.insertAdjacentHTML('beforeend', timeMachineNackupsEmptyTemplate());
	} else {
		_.each(timeMachineBackupsCollection, (entity) => {
			timeMachineBackups.insertAdjacentHTML('beforeend', timeMachineBackupTemplate({ entity }));
		});
	}

	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
};

shareService.subscribe([render]);
