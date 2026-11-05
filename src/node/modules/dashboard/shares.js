import foldersEmptyPartial from 'node/modules/dashboard/partials/folders_empty.html';
import timeCapsuleEmptyPartial from 'node/modules/dashboard/partials/time_capsule_empty.html';
import foldersPartial from 'node/modules/dashboard/partials/shares.html';
import folderPartial from 'node/modules/dashboard/partials/folder.html';
import backupDiskPartial from 'node/modules/dashboard/partials/backup_disk.html';
import * as shareService from 'node/modules/dashboard/services/share';

const foldersEmptyTemplate = _.template(foldersEmptyPartial);
const timeCapsuleEmptyTemplate = _.template(timeCapsuleEmptyPartial);
const foldersTemplate = _.template(foldersPartial);
const folderTemplate = _.template(folderPartial);
const backupDiskTemplate = _.template(backupDiskPartial);
const container = document.querySelector('#shares');

const render = (state) => {
	if (_.isNull(state.shares)) {
		return;
	}

	const foldersCollection = _.filter(state.shares, { isBackupDisk: false });
	const foldersRowInner = (_.isEmpty(foldersCollection)
		? foldersEmptyTemplate()
		: _.join(_.map(foldersCollection, (entity) => folderTemplate({ entity })), ''));

	const backupDiskCollection = _.filter(state.shares, { isBackupDisk: true });
	const backupDisksRowInner = (_.isEmpty(backupDiskCollection)
		? timeCapsuleEmptyTemplate()
		: _.join(_.map(backupDiskCollection, (entity) => backupDiskTemplate({ entity })), ''));

	const rowSlot = /\s*<div class="row"><\/div>/;
	let html = foldersTemplate();
	html = html.replace(rowSlot, `<div class="row">${foldersRowInner}</div>`);
	html = html.replace(rowSlot, `<div class="row">${backupDisksRowInner}</div>`);

	morphdom(
		container,
		`<div>${html}</div>`,
		{ childrenOnly: true }
	);
};

shareService.subscribe([render]);
