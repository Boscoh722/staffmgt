// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Login thunk called with:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('Login API response:', response.data);
      
      if (response.data.token && response.data.user) {
        // Set token in axios headers for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Return the data
        return response.data;
      } else {
        return rejectWithValue('Invalid response from server');
      }
    } catch (error) {
      console.error('Login thunk error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Login failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        
        // Save to localStorage
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        
        // Set axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Login failed';
      });
  }
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;