import badgePartial from '../partials/update_badge.html';
import updateModal from '../partials/modals/update.html';
import updateBody from '../partials/modals/update_body.html';

if (isAuthenticated) {
	document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);
	let modal = document.querySelector('#update');
	let container = document.querySelector('header');

	const showModal = (event) => {
		modal.querySelector('.modal-body').insertAdjacentHTML('afterbegin', _.template(updateBody)({ updates }));
	};

	const restoreModal = (event) => {
		modal.querySelector('.modal-body').innerHTML = '';
	}

	const install = (event) => {
		event.preventDefault();
		console.log('Installing...');
	};

	const fetchData = () => {
		axios.get('/api/v1/updates')
			.then((response) => {
				updates = response.data;
			})
			.catch((error) => {
				updates = [];
			})
			.then(() => {
				render(updates);
			});
	};

	const render = (state) => {
		console.log(state);
		container.querySelector('.navbar-nav').insertAdjacentHTML('beforeend', _.template(badgePartial)({ updates: state }));
	};

	modal.addEventListener('show.bs.modal', showModal);
	modal.addEventListener('hidden.bs.modal', restoreModal);
	modal.querySelector('.install').addEventListener('click', install);

	fetchData();
}
