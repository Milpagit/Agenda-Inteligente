import axios from "axios";

const importScheduleURL = process.env.REACT_APP_IMPORT_SCHEDULE_API_URL;

const importApi = axios.create({
  baseURL: importScheduleURL,
});

export default importApi;
