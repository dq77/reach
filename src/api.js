import axios from 'axios'

axios.defaults.withCredentials = true;
const instance = axios.create({
  // baseURL: 'reach',
  baseURL: 'https://er.767766.xyz/reach',
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