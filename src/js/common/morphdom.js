import mdom from 'morphdom';

const morphdom = (fromNode, toNode, options) => {
	let onBeforeElUpdated = options?.onBeforeElUpdated;
	mdom(fromNode, toNode, {
		...options,
		onBeforeElUpdated: (fromEl, toEl) => {
			if (onBeforeElUpdated) {
				let result = onBeforeElUpdated(fromEl, toEl);
				if (result === false) {
					return false;
				}
			}

			if ((fromEl.classList.contains('dropdown-toggle') || fromEl.classList.contains('dropdown-menu')) && fromEl.classList.contains('show')) {
				morphdom(fromEl, toEl, { childrenOnly: true });
				return false;
			}
		}
	});
};

export {
	morphdom
};
