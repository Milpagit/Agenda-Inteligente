import axios from "axios";

const alertsApiURL = process.env.REACT_APP_ALERTS_API_URL;

const alertsApi = axios.create({
  baseURL: alertsApiURL,
});

export default alertsApi;
