import axios from 'axios'

axios.defaults.withCredentials = true;
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
  timeout: 50000,
});
instance.defaults.withCredentials=true;
instance.interceptors.response.use(function (response) {
  return response?.data || response
}, function (error) {
  return Promise.reject(error);
});

export default instance