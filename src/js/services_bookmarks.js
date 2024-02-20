import categoryPartial from '../partials/category.html';
import servicePartial from '../partials/service.html';
import bookmarkPartial from '../partials/bookmark.html';

let container = document.querySelector('main > .container > .row');

const fetchData = () => {
	axios.get('/data.json')
		.then((response) => {
			render(response.data);
		})
		.catch((error) => {
			console.log(error);
			container.insertAdjacentHTML('afterbegin', '<div class="col align-self-center text-center"><span class="text-red-300">Error fetching data</span></div>');
		});
};

const render = (state) => {
	_.each(_.reverse(state.categories), (cat) => {
		let collection = _.filter(state.configuration, { category: cat.id });
		container.insertAdjacentHTML('afterbegin', _.template(categoryPartial)({ name: cat.name }));
		let category = container.querySelector('.item:first-child');
		_.each(collection, (entity) => {
			if (entity.type === 'service') {
				const template = _.template(servicePartial);
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
