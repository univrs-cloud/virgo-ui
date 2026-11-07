import * as powerService from 'node/services/power';

let toast = null;

const hide = () => {
	toast?.remove();
	toast = null;
};

const render = (state) => {
	if (state.reboot) {
		hide();
		return;
	}

	if (_.isNull(state.rebootRequired)) {
		return;
	}

	if (_.isEmpty(state.rebootRequired)) {
		hide();
		return;
	}

	if (toast) {
		return;
	}

	toast = notifier.add({
		title: 'A reboot is needed to finish the system update.<br><br><u-button type="button" size="sm" click="reboot">Reboot now</u-button>',
		type: 'neutral',
		duration: 0,
		dismissible: true,
		callbacks: {
			reboot: ({ trigger }) => {
				trigger.disabled = true;
				powerService.reboot();
			}
		}
	});
};

powerService.subscribeToRebootRequired([render]);
