import maintenancePartial from 'node/partials/maintenance.html';
import maintenanceImage from 'assets/img/empty/maintenance.svg';
import * as maintenanceService from 'node/services/maintenance';
import * as updateMode from 'libs/update_mode';

const maintenanceTemplate = _.template(maintenancePartial);

let isShown = false;

const show = () => {
	if (isShown) {
		return;
	}

	isShown = true;
	updateMode.enter();
	document.body.insertAdjacentHTML('beforeend', maintenanceTemplate({ maintenanceImage }));
	document.body.classList.add('maintenance');
};

const isUnderMaintenance = (state) => {
	if (state.update?.state === 'running') {
		return true;
	}

	return (state.reboot === true && runtimeRole === 'node');
};

const render = (state) => {
	if (isUnderMaintenance(state)) {
		show();
		return;
	}

	if (isShown) {
		location.reload();
	}
};

maintenanceService.subscribe([render]);
