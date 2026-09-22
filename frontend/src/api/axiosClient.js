import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7100/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosClient.interceptors.request.use(
    (config) => {
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

export default axiosClient;
