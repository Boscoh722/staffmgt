const AuditLog = require('../models/AuditLog');
const geoip = require('geoip-lite');
const useragent = require('user-agent-parse');

const auditMiddleware = async (req, res, next) => {
  // Skip logging for certain paths
  const skipPaths = ['/api/auth/login', '/api/auth/logout', '/health'];
  if (skipPaths.includes(req.path)) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function(body) {
    res.send = originalSend;
    res.send(body);

    // Log the audit after response is sent
    logAudit(req, res, startTime, body);
  };

  next();
};

async function logAudit(req, res, startTime, responseBody) {
  try {
    // Don't log if no user is authenticated (except for login attempts)
    if (!req.user && req.path !== '/api/auth/login') {
      return;
    }

    const responseTime = Date.now() - startTime;
    const ipAddress = getClientIp(req);
    const location = geoip.lookup(ipAddress);
    const userAgent = parseUserAgent(req.headers['user-agent']);
    
    // Determine action based on HTTP method and path
    const action = determineAction(req.method, req.path, res.statusCode);
    
    // Determine entity from path
    const entity = determineEntity(req.path);
    
    // Extract entity ID from path parameters or body
    const entityId = extractEntityId(req);
    
    // Prepare details
    const details = {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      statusCode: res.statusCode,
      responseTime,
      responseSize: JSON.stringify(responseBody).length
    };

    // Add request body for non-sensitive actions
    if (shouldLogRequestBody(req)) {
      details.requestBody = sanitizeRequestBody(req.body);
    }

    // Determine status based on response code
    const status = res.statusCode >= 400 ? 'failed' : 'success';

    // Create audit log
    const auditLog = new AuditLog({
      user: req.user ? req.user._id : null,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent: req.headers['user-agent'],
      location: location ? {
        country: location.country,
        region: location.region,
        city: location.city,
        coordinates: [location.ll[1], location.ll[0]] // Convert to [long, lat]
      } : null,
      status,
      severity: determineSeverity(action, entity, status),
      sessionId: req.sessionID,
      requestId: req.id || generateRequestId(),
      responseTime,
      resource: req.originalUrl || req.url,
      metadata: {
        userRole: req.user ? req.user.role : null,
        userAgent: userAgent
      }
    });

    await auditLog.save();
  } catch (error) {
    console.error('Error logging audit:', error);
    // Don't throw error to avoid breaking the response
  }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function parseUserAgent(userAgentString) {
  if (!userAgentString) return {};
  
  const parsed = useragent.parse(userAgentString);
  return {
    browser: parsed.browser,
    version: parsed.version,
    os: parsed.os,
    platform: parsed.platform,
    isMobile: parsed.isMobile,
    isTablet: parsed.isTablet
  };
}

function determineAction(method, path, statusCode) {
  const pathParts = path.split('/');
  
  // Login/logout specific
  if (path.includes('/auth/login')) {
    return statusCode === 200 ? 'login' : 'login_failed';
  }
  if (path.includes('/auth/logout')) {
    return 'logout';
  }
  
  // Map HTTP methods to actions
  switch (method) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'read';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'other';
  }
}

function determineEntity(path) {
  const pathParts = path.split('/');
  
  // Extract entity from URL path
  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === 'api' && i + 1 < pathParts.length) {
      const entity = pathParts[i + 1];
      return entity.replace('s$', ''); // Remove trailing 's' (e.g., users -> user)
    }
  }
  
  return 'system';
}

function extractEntityId(req) {
  // Try to get entity ID from URL parameters
  const idFromParams = req.params.id || 
                       req.params.userId || 
                       req.params.staffId ||
                       req.params.leaveId ||
                       req.params.caseId;
  
  if (idFromParams) {
    return idFromParams;
  }
  
  // Try to get entity ID from request body
  if (req.body && (req.body._id || req.body.id)) {
    return req.body._id || req.body.id;
  }
  
  return null;
}

function shouldLogRequestBody(req) {
  // Don't log sensitive data
  const sensitivePaths = ['/api/auth/login', '/api/auth/change-password'];
  const sensitiveMethods = ['POST', 'PUT', 'PATCH'];
  
  if (sensitivePaths.includes(req.path)) {
    return false;
  }
  
  if (sensitiveMethods.includes(req.method)) {
    // Check if it's a sensitive entity
    const entity = determineEntity(req.path);
    const sensitiveEntities = ['user', 'auth'];
    return !sensitiveEntities.includes(entity);
  }
  
  return false;
}

function sanitizeRequestBody(body) {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key',
    'creditCard', 'ssn', 'pin', 'cvv'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

function determineSeverity(action, entity, status) {
  // Critical operations
  if (action === 'delete' && ['user', 'system', 'backup'].includes(entity)) {
    return 'critical';
  }
  
  // Failed operations
  if (status === 'failed') {
    if (['login', 'password_change'].includes(action)) {
      return 'high';
    }
    return 'medium';
  }
  
  // High impact operations
  if (['create', 'update'].includes(action) && ['user', 'disciplinary', 'system'].includes(entity)) {
    return 'medium';
  }
  
  return 'low';
}

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = { auditMiddleware, logAudit };
