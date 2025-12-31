import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import staffReducer from './slices/staffSlice';
import leaveReducer from './slices/leaveSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    staff: staffReducer,
    leaves: leaveReducer,
  },
});
