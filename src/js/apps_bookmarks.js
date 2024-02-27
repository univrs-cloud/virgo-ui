import categoryPartial from '../partials/category.html';
import appPartial from '../partials/app.html';
import bookmarkPartial from '../partials/bookmark.html';

let request = null;
let container = document.querySelector('#apps-bookmars');

const fetchData = () => {
	request = new AbortController();
	axios.get('/api/v1/docker/configured', { signal: request.signal })
		.then((response) => {
			render(response.data);
		})
		.catch((error) => {
			if (error.name === 'CanceledError') {
				return;
			}
			
			console.log(error);
			container.insertAdjacentHTML('afterbegin', '<span class="text-red-300">Error fetching data</span>');
		})
		.then(() => {
			request = null;
		});
};

const render = (state) => {
	_.each(_.reverse(state.categories), (cat) => {
		let collection = _.filter(state.configuration, { category: cat.id });
		container.insertAdjacentHTML('afterbegin', _.template(categoryPartial)({ name: cat.name }));
		let category = container.querySelector('.item:first-child');
		_.each(collection, (entity) => {
			if (entity.type === 'app') {
				const template = _.template(appPartial);
				category.insertAdjacentHTML('beforeend', template({ ...entity }));
			}
			if (entity.type === 'bookmark') {
				const template = _.template(bookmarkPartial);
				category.insertAdjacentHTML('beforeend', template({ ...entity }));
			}
		});
	});
};

fetchData();
