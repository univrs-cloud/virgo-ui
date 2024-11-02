import notificationsPartial from 'shell/partials/notifications.html';

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
	render({ notifications: [{ title: 'Data integrity scan', message: 'Scrub repaired 0B in 00:21:04 with 0 errors on Fri Nov 1 00:24:33 2024.', createdOn: '2024-11-01T00:24:33.000Z' }] });
};

export {
	init
};
