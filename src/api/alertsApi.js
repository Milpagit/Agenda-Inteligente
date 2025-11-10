import axios from "axios";

const alertsApiURL =
  "https://us-central1-agenda-b616a.cloudfunctions.net/get_proactive_alerts";

const alertsApi = axios.create({
  baseURL: alertsApiURL,
});

export default alertsApi;
