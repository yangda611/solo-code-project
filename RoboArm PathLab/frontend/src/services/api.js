import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export const calculateIK = async (armConfig, targetPoint) => {
  try {
    const response = await api.post('/api/ik', {
      armConfig,
      targetPoint
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'IK计算失败');
  }
};

export const checkCollision = async (armConfig, jointAngles, obstacles) => {
  try {
    const response = await api.post('/api/collision', {
      armConfig,
      jointAngles,
      obstacles
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '碰撞检测失败');
  }
};

export const planPath = async (armConfig, startAngles, targetPoint, obstacles) => {
  try {
    const response = await api.post('/api/path', {
      armConfig,
      startAngles,
      targetPoint,
      obstacles
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || '路径规划失败');
  }
};

export default {
  calculateIK,
  checkCollision,
  planPath
};
