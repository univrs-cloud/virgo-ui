import footerPartial from '../partials/footer.html';

let container = document.querySelector('footer');
const template = _.template(footerPartial);

const fetchData = () => {
	axios.get('/api/v1/system')
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.log(error);
			return {};
		})
		.then((data) => {
			render(data);
		});
};

const render = (state) => {
	morphdom(container, template({ state }));
};

morphdom(container, template({ state: {} }));

fetchData();
