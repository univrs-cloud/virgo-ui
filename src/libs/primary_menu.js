const STORAGE_KEY = 'menu:collapsed';

const isCollapsed = () => {
	try {
		return localStorage.getItem(STORAGE_KEY) === '1';
	} catch (error) {
		return false;
	}
};

const setCollapsed = (collapsed) => {
	document.body.classList.toggle('menu-collapsed', collapsed);
	try {
		if (collapsed) {
			localStorage.setItem(STORAGE_KEY, '1');
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch (error) {}
	window.dispatchEvent(new Event('resize'));
};

const toggle = (event) => {
	const button = event.target.closest('.menu-toggle');
	if (_.isNull(button)) {
		return;
	}

	bootstrap.Tooltip.getInstance(button)?.hide();
	setCollapsed(!document.body.classList.contains('menu-collapsed'));
};

const updateScrollShadows = () => {
	const list = header.querySelector('nav .nav-pills');
	if (_.isNull(list)) {
		return;
	}

	list.classList.toggle('has-scroll-above', list.scrollTop > 0);
	list.classList.toggle('has-scroll-below', list.scrollTop + list.clientHeight < list.scrollHeight - 1);
};

const header = document.querySelector('header');

document.body.classList.toggle('menu-collapsed', isCollapsed());
header.addEventListener('click', toggle);
header.addEventListener('scroll', updateScrollShadows, true);
window.addEventListener('resize', updateScrollShadows);
new MutationObserver(updateScrollShadows).observe(header, { childList: true, subtree: true });
new bootstrap.Tooltip(header, {
	selector: 'body.menu-collapsed header nav .nav-link, header nav .menu-toggle',
	placement: 'right',
	trigger: 'hover',
	title: (link) => {
		if (link.classList.contains('menu-toggle')) {
			return (document.body.classList.contains('menu-collapsed') ? link.dataset.expandTitle : link.dataset.collapseTitle);
		}

		return _.escape(_.trim(link.querySelector('.nav-label')?.textContent));
	}
});
