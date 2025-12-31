import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Button,
  Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Box, Chip, IconButton, Alert, Snackbar, LinearProgress,
  Tabs, Tab, CardActions, Menu, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Description as CsvIcon,
  Code as JsonIcon,
  FilterList as FilterIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  GetApp as GetAppIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadOutlineIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { reportService } from '../../services/reportService';
import { departmentService } from '../../services/departmentService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const Reports = () => {
  useDocumentTitle('Reports Management');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [generateDialog, setGenerateDialog] = useState(false);
  const [reportType, setReportType] = useState('attendance');
  const [formatType, setFormatType] = useState('excel');
  const [saveReport, setSaveReport] = useState(true);
  const [reportTitle, setReportTitle] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        type: filterType || undefined,
        status: filterStatus || undefined
      };
      
      const response = await reportService.getGeneratedReports(params);
      setReports(response.data.reports);
      setTotalReports(response.data.pagination.total);
    } catch (error) {
      showSnackbar('Error fetching reports: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      const deptList = Array.isArray(response.data) ? response.data : [];
      // Extract department names or IDs
      const deptNames = deptList.map(dept => dept.name || dept._id);
      setDepartments(deptNames);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
      // Fallback to empty array
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDepartments();
  }, [page, rowsPerPage, filterType, filterStatus]);

  // Handle generate report
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const filters = {};
      
      // Add filters based on report type
      if (['attendance', 'leaves', 'disciplinary'].includes(reportType)) {
        filters.startDate = startDate;
        filters.endDate = endDate;
        if (department) filters.department = department;
      }
      
      if (reportType === 'leaves') {
        filters.status = 'approved';
      }

      const options = {
        format: formatType,
        save: saveReport,
        title: reportTitle || undefined
      };

      const result = await reportService.generateReport(reportType, filters, options);

      if (formatType !== 'json') {
        if (saveReport && result.downloadUrl) {
          // Open download URL for saved reports
          window.open(result.downloadUrl, '_blank');
        } else if (result instanceof Blob) {
          // Handle blob download for non-saved reports
          const filename = `${reportType}_report_${Date.now()}.${formatType}`;
          reportService.handleBlobResponse(result, filename);
        }
      }

      showSnackbar(
        saveReport 
          ? 'Report generated and saved successfully!' 
          : 'Report downloaded successfully!',
        'success'
      );
      
      setGenerateDialog(false);
      
      // Refresh reports list if saved
      if (saveReport) {
        setTimeout(fetchReports, 1000);
      }
    } catch (error) {
      showSnackbar('Error generating report: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Quick report actions
  const handleQuickAttendance = async () => {
    const start = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd');
    const end = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const params = {
        startDate: start,
        endDate: end,
        format: 'excel',
        save: false
      };
      
      const response = await reportService.generateAttendanceReport(params);
      reportService.handleBlobResponse(response.data, `attendance_${start}_to_${end}.xlsx`);
      showSnackbar('Attendance report downloaded!', 'success');
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error');
    }
  };

  const handleQuickLeaves = async () => {
    try {
      const params = {
        status: 'approved',
        format: 'excel',
        save: false
      };
      
      const response = await reportService.generateLeaveReport(params);
      reportService.handleBlobResponse(response.data, `leave_report_approved_${Date.now()}.xlsx`);
      showSnackbar('Leave report downloaded!', 'success');
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error');
    }
  };

  // Report actions
  const handleDownload = async (reportId) => {
    try {
      const response = await reportService.downloadReport(reportId);
      const filename = `report_${reportId}.pdf`;
      reportService.handleBlobResponse(response.data, filename);
      showSnackbar('Report downloaded!', 'success');
      fetchReports(); // Refresh to update download count
    } catch (error) {
      showSnackbar('Error downloading: ' + error.message, 'error');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportService.deleteReport(reportId);
      showSnackbar('Report deleted!', 'success');
      fetchReports();
    } catch (error) {
      showSnackbar('Error deleting: ' + error.message, 'error');
    }
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const showSnackbar = (message, severity) => {
    if (severity === 'error') {
      toast.error(message);
    } else if (severity === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }
    // Keep Material-UI snackbar for backward compatibility if needed
    setSnackbar({ open: true, message, severity });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon sx={{ color: '#10B981' }} />;
      case 'processing': return <WarningIcon sx={{ color: '#F59E0B' }} />;
      case 'failed': return <ErrorIcon sx={{ color: '#EF4444' }} />;
      default: return null;
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf': return <PdfIcon sx={{ color: '#DC2626' }} />;
      case 'excel': return <ExcelIcon sx={{ color: '#059669' }} />;
      case 'csv': return <CsvIcon sx={{ color: '#7C3AED' }} />;
      case 'json': return <JsonIcon sx={{ color: '#3B82F6' }} />;
      default: return <DescriptionIcon />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-50 via-mustard-50 to-scarlet-50 dark:from-neutral-900 dark:via-royal-900 dark:to-scarlet-900 font-sans">
    <Box sx={{
      py: 4,
      px: { xs: 2, md: 4 }
    }} className="max-w-7xl mx-auto">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ 
              fontWeight: 700,
              color: 'neutral.900',
              letterSpacing: '-0.025em'
            }}>
              Reports Management
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'neutral.600',
              mb: 1
            }}>
              Generate, view, and download system reports
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setGenerateDialog(true)}
              sx={{
                borderColor: 'mustard.300',
                color: 'neutral.700',
                '&:hover': {
                  backgroundColor: 'mustard.50',
                  borderColor: 'mustard.400'
                },
                borderRadius: 3,
                px: 3,
                py: 1
              }}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlineIcon />}
              onClick={() => {}}
              sx={{
                borderColor: 'mustard.300',
                color: 'neutral.700',
                '&:hover': {
                  backgroundColor: 'mustard.50',
                  borderColor: 'mustard.400'
                },
                borderRadius: 3,
                px: 3,
                py: 1
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setGenerateDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
                  boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)'
                },
                borderRadius: 3,
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)'
              }}
            >
              New Report
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            title: 'Total Reports', 
            value: totalReports,
            icon: <AssessmentIcon />,
            color: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
          },
          { 
            title: 'Completed', 
            value: reports.filter(r => r.status === 'completed').length,
            icon: <CheckCircleIcon />,
            color: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          },
          { 
            title: 'Total Downloads', 
            value: reports.reduce((sum, r) => sum + (r.downloadCount || 0), 0),
            icon: <DownloadIcon />,
            color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
          },
          { 
            title: 'This Month', 
            value: reports.filter(r => {
              const reportDate = new Date(r.createdAt);
              const now = new Date();
              return reportDate.getMonth() === now.getMonth() && 
                     reportDate.getFullYear() === now.getFullYear();
            }).length,
            icon: <TrendingUpIcon />,
            color: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'mustard.100',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 3,
                    background: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    {React.cloneElement(stat.icon, { sx: { color: 'white', fontSize: 24 } })}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: 'neutral.600',
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700,
                      color: 'neutral.900',
                      lineHeight: 1
                    }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Card */}
      <Paper sx={{
        mb: 4,
        p: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'mustard.100',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)'
      }}>
        <Typography variant="h6" gutterBottom sx={{ 
          fontWeight: 600,
          color: 'neutral.900',
          mb: 3
        }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleQuickAttendance}
              sx={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)'
                },
                borderRadius: 3,
                px: 3,
                py: 1.5
              }}
            >
              Last Month Attendance
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleQuickLeaves}
              sx={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                },
                borderRadius: 3,
                px: 3,
                py: 1.5
              }}
            >
              Approved Leaves
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setGenerateDialog(true)}
              sx={{
                borderColor: 'mustard.300',
                color: 'neutral.700',
                '&:hover': {
                  backgroundColor: 'mustard.50',
                  borderColor: 'mustard.400'
                },
                borderRadius: 3,
                px: 3,
                py: 1.5
              }}
            >
              Custom Report
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={fetchReports}
              sx={{
                borderColor: 'mustard.300',
                color: 'neutral.700',
                '&:hover': {
                  backgroundColor: 'mustard.50',
                  borderColor: 'mustard.400'
                },
                borderRadius: 3,
                px: 3,
                py: 1.5
              }}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Paper sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'mustard.100',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'mustard.100',
          background: 'linear-gradient(to right, #FEF3C7 0%, #FDE68A 100%)'
        }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                py: 2,
                px: 3,
                color: 'neutral.600',
                '&.Mui-selected': {
                  color: 'neutral.900'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#D97706',
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab label="Generated Reports" />
            <Tab label="Report Templates" />
          </Tabs>
        </Box>

        {/* Generated Reports Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Filters */}
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              gap: 2, 
              flexWrap: 'wrap',
              p: 2,
              background: '#FEFCE8',
              borderRadius: 3
            }}>
              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    borderColor: '#FBBF24',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F59E0B'
                    }
                  }
                }}
              >
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={filterType}
                  label="Report Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="leaves">Leaves</MenuItem>
                  <MenuItem value="disciplinary">Disciplinary</MenuItem>
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="dashboard">Dashboard</MenuItem>
                </Select>
              </FormControl>

              <FormControl 
                size="small" 
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    borderColor: '#FBBF24',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#F59E0B'
                    }
                  }
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Reports Table */}
            {loading && (
              <LinearProgress sx={{ 
                mb: 2,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                }
              }} />
            )}
            
            <TableContainer sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'mustard.100'
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{
                    background: 'linear-gradient(to right, #FEF3C7 0%, #FDE68A 100%)'
                  }}>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Title</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Type</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Format</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Status</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Generated</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Downloads</TableCell>
                    <TableCell sx={{
                      fontWeight: 600,
                      color: 'neutral.700',
                      py: 2
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow 
                      key={report._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#FEFCE8'
                        },
                        '&:last-child td': {
                          borderBottom: 0
                        }
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'neutral.900' }}>
                          {report.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'neutral.500' }}>
                          By {report.generatedBy?.firstName} {report.generatedBy?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip 
                          label={report.reportType} 
                          size="small" 
                          sx={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: 2
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getFormatIcon(report.format)}
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'neutral.700' }}>
                            {report.format.toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(report.status)}
                          <Chip 
                            label={report.status} 
                            size="small"
                            sx={{
                              background: report.status === 'completed' ? '#D1FAE5' :
                                         report.status === 'processing' ? '#FEF3C7' :
                                         report.status === 'failed' ? '#FEE2E2' : '#E5E7EB',
                              color: report.status === 'completed' ? '#065F46' :
                                     report.status === 'processing' ? '#92400E' :
                                     report.status === 'failed' ? '#991B1B' : '#374151',
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ color: 'neutral.700' }}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          color: report.downloadCount > 0 ? '#059669' : 'neutral.500'
                        }}>
                          {report.downloadCount || 0}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(report._id)}
                          disabled={report.status !== 'completed'}
                          sx={{
                            color: report.status === 'completed' ? '#059669' : 'neutral.400',
                            '&:hover': {
                              backgroundColor: report.status === 'completed' ? '#D1FAE5' : 'neutral.100'
                            }
                          }}
                        >
                          <GetAppIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, report)}
                          sx={{
                            color: 'neutral.600',
                            '&:hover': {
                              backgroundColor: 'neutral.100'
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalReports}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 500,
                  color: 'neutral.700'
                },
                '& .MuiTablePagination-actions button': {
                  color: 'neutral.700'
                }
              }}
            />
          </Box>
        )}

        {/* Report Templates Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ 
              fontWeight: 600,
              color: 'neutral.900',
              mb: 2
            }}>
              Report Templates
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'neutral.600',
              mb: 4
            }}>
              Pre-configured report templates for quick generation
            </Typography>
            
            <Grid container spacing={3}>
              {[
                { 
                  type: 'attendance', 
                  title: 'Monthly Attendance', 
                  description: 'Attendance summary for the current month',
                  color: '#7C3AED'
                },
                { 
                  type: 'leaves', 
                  title: 'Quarterly Leave Report', 
                  description: 'Leave analysis for the quarter',
                  color: '#10B981'
                },
                { 
                  type: 'disciplinary', 
                  title: 'Disciplinary Cases', 
                  description: 'All open disciplinary cases',
                  color: '#F59E0B'
                },
                { 
                  type: 'performance', 
                  title: 'Performance Review', 
                  description: 'Staff performance metrics',
                  color: '#EF4444'
                },
              ].map((template) => (
                <Grid item xs={12} sm={6} md={3} key={template.type}>
                  <Card sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'mustard.100',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                      borderColor: template.color
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${template.color}99 0%, ${template.color} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                      }}>
                        {template.type === 'attendance' && <HistoryIcon sx={{ color: 'white' }} />}
                        {template.type === 'leaves' && <CheckCircleIcon sx={{ color: 'white' }} />}
                        {template.type === 'disciplinary' && <WarningIcon sx={{ color: 'white' }} />}
                        {template.type === 'performance' && <TrendingUpIcon sx={{ color: 'white' }} />}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 600,
                        color: 'neutral.900'
                      }}>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'neutral.600',
                        mb: 2
                      }}>
                        {template.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ px: 3, pb: 2 }}>
                      <Button 
                        size="small" 
                        onClick={() => {
                          setReportType(template.type);
                          setGenerateDialog(true);
                        }}
                        sx={{
                          background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)'
                          },
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Use Template
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Generate Report Dialog */}
      <Dialog 
        open={generateDialog} 
        onClose={() => setGenerateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: 'mustard.100',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          color: 'neutral.900',
          background: 'linear-gradient(to right, #FEF3C7 0%, #FDE68A 100%)',
          py: 2
        }}>
          Generate New Report
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'neutral.600' }}>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
                sx={{
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FBBF24'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#F59E0B'
                  }
                }}
              >
                <MenuItem value="attendance">Attendance Report</MenuItem>
                <MenuItem value="leaves">Leave Report</MenuItem>
                <MenuItem value="disciplinary">Disciplinary Report</MenuItem>
                <MenuItem value="performance">Performance Report</MenuItem>
                <MenuItem value="dashboard">Dashboard Report</MenuItem>
                <MenuItem value="department">Department Report</MenuItem>
                <MenuItem value="leave-balance">Leave Balance Report</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'neutral.600' }}>Format</InputLabel>
              <Select
                value={formatType}
                label="Format"
                onChange={(e) => setFormatType(e.target.value)}
                sx={{
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FBBF24'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#F59E0B'
                  }
                }}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON (Preview)</MenuItem>
              </Select>
            </FormControl>

            {['attendance', 'leaves', 'disciplinary'].includes(reportType) && (
              <>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FBBF24'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B'
                      }
                    }
                  }}
                />
                
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FBBF24'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B'
                      }
                    }
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'neutral.600' }}>Department (Optional)</InputLabel>
                  <Select
                    value={department}
                    label="Department (Optional)"
                    onChange={(e) => setDepartment(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FBBF24'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#F59E0B'
                      }
                    }}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <TextField
              fullWidth
              label="Report Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#FBBF24'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#F59E0B'
                  }
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="saveReport"
                checked={saveReport}
                onChange={(e) => setSaveReport(e.target.checked)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: '2px solid #FBBF24',
                  accentColor: '#D97706'
                }}
              />
              <label htmlFor="saveReport" style={{ marginLeft: 12, color: '#4B5563', fontWeight: 500 }}>
                Save report to history
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={() => setGenerateDialog(false)}
            sx={{
              color: 'neutral.600',
              borderColor: 'mustard.300',
              borderRadius: 3,
              px: 3,
              '&:hover': {
                backgroundColor: 'mustard.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateReport}
            disabled={generating}
            startIcon={generating ? null : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
                boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)'
              },
              borderRadius: 3,
              px: 3,
              py: 1
            }}
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'mustard.100',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => {
          if (selectedReport) {
            window.open(`/api/reports/view/${selectedReport._id}`, '_blank');
          }
          handleMenuClose();
        }}
        sx={{
          '&:hover': {
            backgroundColor: '#FEF3C7'
          }
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedReport) {
            handleDownload(selectedReport._id);
          }
          handleMenuClose();
        }}
        sx={{
          '&:hover': {
            backgroundColor: '#FEF3C7'
          }
        }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedReport) {
            handleDelete(selectedReport._id);
          }
          handleMenuClose();
        }} 
        sx={{ 
          color: '#EF4444',
          '&:hover': {
            backgroundColor: '#FEE2E2'
          }
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            fontWeight: 500
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </div>
  );
};

export default Reports;