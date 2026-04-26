import axios from "axios";

const functionsURL = process.env.REACT_APP_FUNCTIONS_API_URL;

const functionsApi = axios.create({
  baseURL: functionsURL,
});

export default functionsApi;
