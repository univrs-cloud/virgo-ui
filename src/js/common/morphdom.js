import mdom from 'morphdom';

const morphdom = (fromNode, toNode, options) => {
	let newOptions = options || {};
	let onBeforeElUpdated = options?.onBeforeElUpdated;
	newOptions.onBeforeElUpdated = (fromEl, toEl) => {
		if (onBeforeElUpdated) {
			let result = onBeforeElUpdated(fromEl, toEl);
			if (result === false) {
				return false;
			}
		}
		
		if (fromEl.getAttribute('data-bs-toggle') === 'tab') {
			mdom(fromEl, toEl, { childrenOnly: true });
			return false;
		}
		
		if (fromEl.getAttribute('data-bs-toggle') === 'tooltip') {
			mdom(fromEl, toEl, { childrenOnly: true });
			if (fromEl.hasAttribute('data-bs-original-title')) {
				fromEl.dataset.bsOriginalTitle = toEl.getAttribute('title') ?? '';
			}

			return false;
		}
		
		if ((fromEl.classList.contains('dropdown-toggle') || fromEl.classList.contains('dropdown-menu')) && fromEl.classList.contains('show')) {
			morphdom(fromEl, toEl, { childrenOnly: true });
			return false;
		}
	};

	return mdom(fromNode, toNode, newOptions);
};

export {
	morphdom
};
