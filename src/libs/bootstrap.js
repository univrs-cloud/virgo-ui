bootstrap.Tooltip.Default.container = 'body';
bootstrap.Tooltip.Default.html = true;
bootstrap.Tooltip.Default.sanitize = false;
bootstrap.Tooltip.Default.selector = '[data-bs-toggle="tooltip"]';
new bootstrap.Tooltip(document.querySelector('body'));

bootstrap.Modal.Default.backdrop = 'static';
bootstrap.Modal.Default.keyboard = false;
bootstrap.Modal.Default.focus = false;

const addScrollbar = (modal) => {
	if (modal.querySelector('.scrollbar')) {
		updateScrollbar();
		return;
	}

	const modalBody = modal.querySelector('.modal-body');
	modal.querySelector('.modal-content').insertAdjacentHTML('beforeend', `<div class="scrollbar"><div class="scrollbar-thumb"></div></div>`);

	const scrollbar = modal.querySelector('.scrollbar');
	const scrollbarThumb = modal.querySelector('.scrollbar-thumb');
	
	let isDragging = false;
	let startY = 0;
	let startScrollTop = 0;

	updateScrollbar();
	window.addEventListener('resize', updateScrollbar);
	modalBody.addEventListener('scroll', updateScrollbar);
	modalBody.addEventListener('wheel', (event) => {
		event.preventDefault();
		modalBody.scrollTop += event.deltaY;
	}, { passive: false });
	scrollbar.addEventListener('wheel', (event) => {
		event.preventDefault();
		modalBody.scrollTop += event.deltaY;
	}, { passive: false });
	scrollbar.addEventListener('click', (event) => {
		if (event.target === scrollbarThumb) {
			return;
		}
		
		const rect = scrollbar.getBoundingClientRect();
		const clickY = event.clientY - rect.top;
		const scrollbarHeight = scrollbar.clientHeight;
		const thumbHeight = scrollbarThumb.clientHeight;
		const scrollPercentage = (clickY - thumbHeight / 2) / (scrollbarHeight - thumbHeight);
		modalBody.scrollTop = scrollPercentage * (modalBody.scrollHeight - modalBody.clientHeight);
	});
	scrollbarThumb.addEventListener('mousedown', (event) => {
		isDragging = true;
		startY = event.clientY;
		startScrollTop = modalBody.scrollTop;
		scrollbarThumb.classList.add('dragging');
		event.preventDefault();
	});
	document.addEventListener('mousemove', (event) => {
		if (!isDragging) {
			return;
		}
		
		const deltaY = event.clientY - startY;
		const scrollbarHeight = scrollbar.clientHeight;
		const thumbHeight = scrollbarThumb.clientHeight;
		const scrollRatio = (modalBody.scrollHeight - modalBody.clientHeight) / (scrollbarHeight - thumbHeight);
		modalBody.scrollTop = startScrollTop + (deltaY * scrollRatio);
	});
	document.addEventListener('mouseup', (event) => {
		isDragging = false;
		scrollbarThumb.classList.remove('dragging');
	});

	function updateScrollbar() {
		const isScrollable = modalBody.scrollHeight > modalBody.clientHeight;
		modalBody.classList.toggle('has-scrollbar', isScrollable);
		scrollbar.classList.toggle('opacity-100', isScrollable);
		if (!isScrollable) {
			return;
		}

		const scrollPercentage = modalBody.scrollTop / (modalBody.scrollHeight - modalBody.clientHeight);
		const scrollbarHeight = scrollbar.clientHeight;
		const thumbHeight = Math.max(30, (modalBody.clientHeight / modalBody.scrollHeight) * scrollbarHeight);
		const thumbTop = scrollPercentage * (scrollbarHeight - thumbHeight);
		
		scrollbarThumb.style.height = thumbHeight + 'px';
		scrollbarThumb.style.top = thumbTop + 'px';
	}
};

document.addEventListener('shown.bs.modal', (event) => {
	const modal = event.target;
	modal.querySelector('u-input:not([type="hidden"])')?.focus(); // focus 1st input after modal is shown
	addScrollbar(modal);
});
