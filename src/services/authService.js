// 重新导出apiService中的认证相关方法，保持向后兼容
export { 
  login,
  register, 
  getUserInfo,
  getUserInfoDetail,
  refreshToken,
  logout 
} from './apiService';

// 为了向后兼容，保留AuthService类
class AuthService {
  constructor() {
    console.warn('AuthService已废弃，请直接使用apiService中的方法');
  }
}

export const authService = new AuthService();