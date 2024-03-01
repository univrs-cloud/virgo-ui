import footerPartial from '../partials/footer.html';

let container = document.querySelector('footer');

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
	container.querySelector('.serial-number').innerHTML = `SN:${state.serial || '&mdash;'}`;
};

morphdom(container, footerPartial);

fetchData();
