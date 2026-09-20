import mdom from 'morphdom';

const TOOLTIP_SELECTOR = '[data-bs-toggle="tooltip"]';

const removeTooltip = (element) => {
	const tipId = element.getAttribute('aria-describedby');
	bootstrap.Tooltip.getInstance(element)?.dispose();
	if (tipId) {
		document.getElementById(tipId)?.remove();
	}
};

const removeTooltips = (node) => {
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return;
	}

	if (node.matches(TOOLTIP_SELECTOR)) {
		removeTooltip(node);
	}
	node.querySelectorAll(TOOLTIP_SELECTOR).forEach(removeTooltip);
};

const morphdom = (fromNode, toNode, options) => {
	let onBeforeElUpdated = options?.onBeforeElUpdated;
	let onBeforeNodeDiscarded = options?.onBeforeNodeDiscarded;
	mdom(fromNode, toNode, {
		...options,
		onBeforeElUpdated: (fromEl, toEl) => {
			if (onBeforeElUpdated) {
				const result = onBeforeElUpdated(fromEl, toEl);
				if (result === false) {
					return false;
				}
			}

			if ((fromEl.classList.contains('dropdown-toggle') || fromEl.classList.contains('dropdown-menu')) && fromEl.classList.contains('show')) {
				morphdom(fromEl, toEl, { childrenOnly: true });
				return false;
			}
		},
		onBeforeNodeDiscarded: (node) => {
			if (onBeforeNodeDiscarded) {
				const result = onBeforeNodeDiscarded(node);
				if (result === false) {
					return false;
				}
			}

			removeTooltips(node);
		}
	});
};

export default morphdom;
