import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';

// Async Thunks
export const fetchMyLeaves = createAsyncThunk(
  'leave/fetchMyLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await staffService.getMyLeaves();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch your leaves');
    }
  }
);

export const fetchLeaveStats = createAsyncThunk(
  'leave/fetchLeaveStats',
  async (staffId, { rejectWithValue }) => {
    try {
      const response = await staffService.getLeaveStats(staffId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave statistics');
    }
  }
);

export const cancelLeave = createAsyncThunk(
  'leave/cancelLeave',
  async (leaveId, { rejectWithValue }) => {
    try {
      const response = await staffService.cancelLeave(leaveId);
      toast.success('Leave cancelled successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel leave');
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel leave');
    }
  }
);

export const fetchLeaveBalance = createAsyncThunk(
  'leave/fetchLeaveBalance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await staffService.getLeaveStats(auth.user._id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave balance');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    myLeaves: [],
    leaveBalance: {},
    leaveStats: {},
    loading: false,
    error: null,
    filters: {
      status: '',
      leaveType: '',
      startDate: '',
      endDate: ''
    }
  },
  reducers: {
    setLeaveFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearLeaveError: (state) => {
      state.error = null;
    },
    resetLeaveState: (state) => {
      state.myLeaves = [];
      state.leaveBalance = {};
      state.leaveStats = {};
      state.filters = {
        status: '',
        leaveType: '',
        startDate: '',
        endDate: ''
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Leaves
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Leave Stats
      .addCase(fetchLeaveStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeaveStats.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveStats = action.payload;
      })
      .addCase(fetchLeaveStats.rejected, (state) => {
        state.loading = false;
      })
      
      // Cancel Leave
      .addCase(cancelLeave.fulfilled, (state, action) => {
        const index = state.myLeaves.findIndex(leave => leave._id === action.meta.arg);
        if (index !== -1) {
          state.myLeaves[index].status = 'cancelled';
        }
      })
      
      // Fetch Leave Balance
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.leaveBalance = action.payload;
      });
  }
});

export const { setLeaveFilters, clearLeaveError, resetLeaveState } = leaveSlice.actions;

export default leaveSlice.reducer;