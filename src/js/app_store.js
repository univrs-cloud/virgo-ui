import storePartial from '../partials/app_store.html';
import itemPartial from '../partials/app_store_item.html';

document.querySelector('body').insertAdjacentHTML('beforeend', storePartial);

let request = null;
let modal = document.querySelector('#app-store');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let oops = modalBody.querySelector('.oops');
let row = modalBody.querySelector('.row');

modal.addEventListener('show.bs.modal', (event) => {
	fetchData();
});

modal.addEventListener('hidden.bs.modal', (event) => {
	if (!_.isNull(request)) {
		request.abort();
	}
	row.innerHTML = '';
	oops.classList.add('d-none');
	loading.classList.remove('d-none');
});

const fetchData = () => {
	request = new AbortController();
	axios.get('/api/v1/docker/templates', { signal: request.signal })
		.then((response) => {
			render(response.data);
		})
		.catch((error) => {
			if (error.name === 'CanceledError') {
				return;
			}

			console.log(error);
			loading.classList.add('d-none');
			oops.classList.remove('d-none');
		})
		.then(() => {
			request = null;
		});
};

const render = (state) => {
	loading.classList.add('d-none');
	_.each(_.orderBy(state, 'title'), (app) => {
		const template = _.template(itemPartial);
		row.insertAdjacentHTML('beforeend', template({ app }));
	});
	_.each(modalBody.querySelectorAll('.install'), (button) => {
		button.addEventListener('click', (event) => {
			event.preventDefault();
		});
	});
};
