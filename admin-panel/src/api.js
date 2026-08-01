import axios from 'axios';
import Swal from 'sweetalert2';

let activeRequests = 0;

const showLoader = () => {
  if (activeRequests === 0) {
    Swal.fire({
      title: 'Loading...',
      text: 'Please wait...',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
  activeRequests++;
};

// 

const hideLoader = () => {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    Swal.close();
  }
};

const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL:'https://api.snetdumka.com/api'
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    showLoader();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
