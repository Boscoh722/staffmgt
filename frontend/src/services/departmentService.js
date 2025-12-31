import api from './api';

export const departmentService = {
  getDepartments: (params) => api.get('/departments', { params }),
  getDepartmentOptions: () => api.get('/departments/options'),
  getDepartment: (id) => api.get(`/departments/${id}`),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentStaff: (id) => api.get(`/departments/${id}/staff`),
};
