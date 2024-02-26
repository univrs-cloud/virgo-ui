import footerPartial from '../partials/footer.html';

let footer = document.querySelector('footer');

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
	footer.querySelector('.serial-number').innerHTML = `SN:${state.serial || '&mdash;'}`;
};

morphdom(footer, footerPartial);

fetchData();
