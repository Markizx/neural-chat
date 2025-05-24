const apiResponse = (success, data = null, error = null, pagination = null) => {
  const response = {
    success,
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      platform: 'web',
      requestId: generateRequestId()
    }
  };

  if (success && data !== null) {
    response.data = data;
  }

  if (!success && error !== null) {
    response.error = error;
  }

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return response;
};

const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = { apiResponse };