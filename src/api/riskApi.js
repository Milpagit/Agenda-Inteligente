import axios from "axios";

const riskURL = process.env.REACT_APP_RISK_API_URL;

const riskApi = axios.create({
  baseURL: riskURL,
});

export default riskApi;
