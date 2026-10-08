import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7100/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

let pendingRequests = 0;
export const getPendingRequests = () => pendingRequests;
const notifyActivity = () => window.dispatchEvent(new CustomEvent('api-activity', { detail: pendingRequests }));

axiosClient.interceptors.request.use(
    (config) => {
        pendingRequests += 1;
        config._activityTracked = true;
        notifyActivity();
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        const selectedBranch = localStorage.getItem('selectedSucursalId');
        if (selectedBranch) {
            config.headers['X-Sucursal-ID'] = selectedBranch;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    response => {
        if (response.config._activityTracked) pendingRequests = Math.max(0, pendingRequests - 1);
        notifyActivity();
        return response;
    },
    error => {
        if (error.config?._activityTracked) pendingRequests = Math.max(0, pendingRequests - 1);
        notifyActivity();
        return Promise.reject(error);
    },
);

export default axiosClient;
