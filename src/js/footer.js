import footerPartial from 'partials/footer.html';
import * as systemService from 'js/services/system';

const footerTemplate = _.template(footerPartial);
let container = document.querySelector('footer');

const render = (state) => {
	morphdom(
		container,
		footerTemplate({ system: state.system, version: VERSION })
	);
};

render({ system: systemService.getSystem() });

systemService.subscribe([render]);
