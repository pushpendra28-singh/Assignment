import api from './config';

export const taskApi = {
  getAllTasks: (params) => api.get('/tasks', { params }),
  getProjectTasks: (projectId, params) =>
    api.get(`/projects/${projectId}/tasks`, { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  addComment: (id, text) => api.post(`/tasks/${id}/comments`, { text }),
};