import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// API 响应格式
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 成功响应，返回 data 字段
    return response.data.data !== undefined ? response.data.data : response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.error || '请求失败';
      const errorCode = data?.code;

      // 401 未授权 - 重定向到登录页
      if (status === 401) {
        toast.error('请先登录');
        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return Promise.reject(new Error(errorMessage));
      }

      // 403 无权访问
      if (status === 403) {
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // 404 资源不存在
      if (status === 404) {
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // 429 限流
      if (status === 429) {
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // 其他错误
      toast.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    // 网络错误或超时
    if (error.code === 'ECONNABORTED') {
      toast.error('请求超时，请稍后重试');
    } else if (error.message === 'Network Error') {
      toast.error('网络连接失败，请检查网络');
    } else {
      toast.error('请求失败，请稍后重试');
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
export const api = {
  /**
   * GET 请求
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config);
  },

  /**
   * POST 请求
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config);
  },

  /**
   * PUT 请求
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config);
  },

  /**
   * PATCH 请求
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch(url, data, config);
  },

  /**
   * DELETE 请求
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config);
  },
};

export default api;
