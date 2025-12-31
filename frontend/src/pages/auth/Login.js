import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Login = () => {
  useDocumentTitle('Login');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));

    if (result.payload?.user) {
      switch (result.payload.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'supervisor':
          navigate('/supervisor');
          break;
        case 'staff':
          navigate('/staff');
          break;
        case 'clerk':
          navigate('/clerk');
          break;
        default:
          navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-royal-50 via-scarlet-50 to-mustard-50 dark:from-neutral-900 dark:via-royal-950 dark:to-scarlet-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto h-16 w-16 bg-theme-gradient rounded-full flex items-center justify-center shadow-xl">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.623a10.953 10.953 0 01-1.67.624 3 3 0 100-5.244 10.954 10.954 0 011.67.624" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Makongeni Ward
          </h2>
          <p className="mt-2 text-royal-600 dark:text-royal-300 font-medium">
            Staff Management System
          </p>
        </div>

        <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm py-8 px-6 shadow-2xl rounded-2xl border border-mustard-100 dark:border-mustard-900/30">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-gradient-to-r from-scarlet-50 to-mustard-50 dark:from-scarlet-900/20 dark:to-mustard-900/20 border border-scarlet-200 dark:border-scarlet-800/50 rounded-xl p-4">
                <p className="text-sm text-scarlet-700 dark:text-scarlet-300 text-center">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white placeholder-royal-400 dark:placeholder-royal-500 transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 font-sans"
                placeholder="staff@makongeni.go.ke"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-mustard-200 dark:border-mustard-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-transparent bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-white placeholder-royal-400 dark:placeholder-royal-500 pr-12 transition-all duration-200 hover:border-mustard-300 dark:hover:border-mustard-700 font-sans"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-mustard-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-mustard-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-mustard-500 via-scarlet-500 to-royal-500 hover:from-mustard-600 hover:via-scarlet-600 hover:to-royal-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-mustard-200 dark:hover:shadow-mustard-900/30 font-sans"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center space-y-4">
          <div className="pt-4 border-t border-mustard-200/50 dark:border-mustard-800/50">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-sans">
              Looking for staff welfare services?
            </p>
            <a
              href="https://makongeniwelfare.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 font-medium transition-all duration-200 hover:gap-2 group font-sans"
            >
              Visit Staff Welfare Portal
              <svg className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <p className="text-xs text-royal-500/70 dark:text-royal-400/60 pt-2 font-sans">
            © {new Date().getFullYear()} Makongeni Ward. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;