import axios from "axios";

export const get = (apiEndpoint: string) => {
	// Make the API call using Axios
	return axios.get(apiEndpoint);
};
