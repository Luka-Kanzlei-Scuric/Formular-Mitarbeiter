export const API_BASE_URL = 'http://localhost:5001/api';

export const endpoints = {
    forms: `${API_BASE_URL}/forms`,
    formByTaskId: (taskId) => `${API_BASE_URL}/forms/${taskId}`,
};