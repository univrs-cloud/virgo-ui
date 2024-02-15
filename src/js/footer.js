import footerPartial from '../partials/footer.html';

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
	const template = _.template(footerPartial);
	morphdom(document.querySelector('footer'), template({ ...state }));
};

fetchData();
