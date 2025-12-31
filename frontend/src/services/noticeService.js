// Notice service removed — frontend no longer uses notices.
// Keeping this stub prevents import errors in case any references remain.

const noticeService = {
  // Legacy stub methods (return rejected promise to surface any accidental calls)
  getNotices: () => Promise.reject(new Error('noticeService removed')),
  getNoticeById: () => Promise.reject(new Error('noticeService removed')),
  createNotice: () => Promise.reject(new Error('noticeService removed')),
  updateNotice: () => Promise.reject(new Error('noticeService removed')),
  deleteNotice: () => Promise.reject(new Error('noticeService removed')),
  getDashboardNotices: () => Promise.reject(new Error('noticeService removed'))
};

export default noticeService;