import sharesPartial from '../partials/shares.html';
import sharePartial from '../partials/share.html';

let container = document.querySelector('#shares');
let shares = [
	{
		name: 'downloads',
		isPrivate: false
	},
	{
		name: 'time machine user 1',
		isPrivate: true
	},
	{
		name: 'time machine user 2',
		isPrivate: true

	}
];

const shareTemplate = _.template(sharePartial);

const render = (state) => {
	let template = document.createElement('template');
	template.innerHTML = _.template(sharesPartial)();
	let shares = template.content.querySelector('.col');
	_.each(state.shares, (entity) => {
		shares.insertAdjacentHTML('beforeend', shareTemplate({ entity }));
	});
	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{
			 childrenOnly: true,
			 onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('dropdown')) {
					return false;
				}

				return true;
			 }
		}
	);
};

render({ shares });
