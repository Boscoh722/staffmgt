import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { staffService } from '../../services/staffService';
import toast from 'react-hot-toast';

// Async Thunks
export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async (_, { rejectWithValue }) => {
    try {
      const response = await staffService.getStaff();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch staff');
    }
  }
);

export const fetchStaffProfile = createAsyncThunk(
  'staff/fetchStaffProfile',
  async (staffId, { rejectWithValue }) => {
    try {
      const response = await staffService.getProfile(staffId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch staff profile');
    }
  }
);

export const updateStaffProfile = createAsyncThunk(
  'staff/updateStaffProfile',
  async ({ staffId, updates }, { rejectWithValue }) => {
    try {
      const response = await staffService.updateProfile(staffId, updates);
      toast.success('Profile updated successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const addQualification = createAsyncThunk(
  'staff/addQualification',
  async ({ staffId, qualification }, { rejectWithValue }) => {
    try {
      const response = await staffService.addQualification(staffId, qualification);
      toast.success('Qualification added successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add qualification');
      return rejectWithValue(error.response?.data?.error || 'Failed to add qualification');
    }
  }
);

export const markAttendance = createAsyncThunk(
  'staff/markAttendance',
  async (attendanceData, { rejectWithValue }) => {
    try {
      const response = await staffService.markAttendance(attendanceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to mark attendance');
    }
  }
);

export const fetchAttendance = createAsyncThunk(
  'staff/fetchAttendance',
  async (params, { rejectWithValue }) => {
    try {
      const response = await staffService.getAttendance(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch attendance');
    }
  }
);

export const applyLeave = createAsyncThunk(
  'staff/applyLeave',
  async (leaveData, { rejectWithValue }) => {
    try {
      const response = await staffService.applyLeave(leaveData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to apply for leave');
    }
  }
);

export const fetchLeaves = createAsyncThunk(
  'staff/fetchLeaves',
  async (params, { rejectWithValue }) => {
    try {
      const response = await staffService.getAllLeaves(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leaves');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'staff/updateLeaveStatus',
  async ({ leaveId, statusData }, { rejectWithValue }) => {
    try {
      const response = await staffService.updateLeaveStatus(leaveId, statusData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update leave status');
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    staffList: [],
    selectedStaff: null,
    attendance: [],
    leaves: [],
    loading: false,
    error: null,
    filters: {
      department: '',
      status: '',
      search: ''
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedStaff: (state) => {
      state.selectedStaff = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Staff
      .addCase(fetchStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Staff Profile
      .addCase(fetchStaffProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStaff = action.payload;
      })
      .addCase(fetchStaffProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Staff Profile
      .addCase(updateStaffProfile.fulfilled, (state, action) => {
        if (state.selectedStaff && state.selectedStaff._id === action.payload._id) {
          state.selectedStaff = action.payload;
        }
        const index = state.staffList.findIndex(staff => staff._id === action.payload._id);
        if (index !== -1) {
          state.staffList[index] = action.payload;
        }
      })
      
      // Add Qualification
      .addCase(addQualification.fulfilled, (state, action) => {
        if (state.selectedStaff) {
          state.selectedStaff.qualifications = action.payload;
        }
      })
      
      // Mark Attendance
      .addCase(markAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.loading = false;
        // Update attendance record in the list
        const index = state.attendance.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.attendance[index] = action.payload;
        } else {
          state.attendance.push(action.payload);
        }
      })
      .addCase(markAttendance.rejected, (state) => {
        state.loading = false;
      })
      
      // Fetch Attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state) => {
        state.loading = false;
      })
      
      // Apply Leave
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state) => {
        state.loading = false;
      })
      
      // Fetch Leaves
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchLeaves.rejected, (state) => {
        state.loading = false;
      });
  }
});

export const { setFilters, clearError, clearSelectedStaff } = staffSlice.actions;

export default staffSlice.reducer;