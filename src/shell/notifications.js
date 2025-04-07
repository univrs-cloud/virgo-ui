import notificationsPartial from 'shell/partials/notifications.html';
import * as jobs from 'shell/jobs';

const notificationsTemplate = _.template(notificationsPartial);

const render = (state) => {
	if (_.isNull(state.notifications)) {
		return;
	}

	let notifications = state.notifications;
	morphdom(
		document.querySelector('#notifications'),
		notificationsTemplate({ notifications, moment })
	);
};

const init = () => {
	render({ notifications: [
		// { type: 'info', title: 'Data integrity scan', message: 'Scrub repaired 0B in 00:21:04 with 0 errors on Fri Nov 1 00:24:33 2024.', createdOn: '2024-11-01T00:24:33.000Z' },
		// { type: 'warning', title: 'Drive temperature warning', message: 'Drive nvme0 is experiencing temperatures (75°C) above typical operating levels.', createdOn: '2024-10-30T12:11:26.000Z' }
	] });
};

jobs.init();

export {
	init
};
