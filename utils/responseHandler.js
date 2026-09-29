export const getRequestLanguage = (req, explicitLang = null) => {
  const allowed = ['en', 'de', 'fr', 'it'];

  // 1. Explicitly passed language parameter if provided, valid, and not the default 'en'
  if (explicitLang && typeof explicitLang === 'string') {
    const cleanExplicit = explicitLang.toLowerCase().trim();
    if (allowed.includes(cleanExplicit) && cleanExplicit !== 'en') {
      return cleanExplicit;
    }
  }

  // 2. Query parameter (?lang=de or ?language=de)
  const queryLang = req?.query?.lang || req?.query?.language;
  if (queryLang && typeof queryLang === 'string') {
    const cleanQuery = queryLang.toLowerCase().trim();
    if (allowed.includes(cleanQuery)) {
      return cleanQuery;
    }
  }

  // 3. Custom headers (headers: { language: 'de' } or { lang: 'de' })
  const headerLang = req?.headers?.language || req?.headers?.lang;
  if (headerLang && typeof headerLang === 'string') {
    const cleanHeader = headerLang.toLowerCase().trim();
    if (allowed.includes(cleanHeader)) {
      return cleanHeader;
    }
  }

  // 4. Authenticated user's preferred language (from DB / req.user / res.locals)
  const userLang = req?.user?.language || req?.res?.locals?.language || req?.locals?.language;
  if (userLang && typeof userLang === 'string') {
    const cleanUser = userLang.toLowerCase().trim();
    if (allowed.includes(cleanUser)) {
      return cleanUser;
    }
  }

  // 5. If explicitLang was explicitly 'en' and no user profile language was found
  if (explicitLang && typeof explicitLang === 'string') {
    const cleanExplicit = explicitLang.toLowerCase().trim();
    if (allowed.includes(cleanExplicit)) {
      return cleanExplicit;
    }
  }

  // 6. Browser Accept-Language header (lower priority than user account preference)
  const acceptHeader = req?.headers?.['accept-language'];
  if (acceptHeader && typeof acceptHeader === 'string') {
    const parts = acceptHeader.split(',').map(part => {
      const [l] = part.trim().split(';');
      return l.substring(0, 2).toLowerCase();
    });
    const matched = parts.find(l => allowed.includes(l));
    if (matched) return matched;
  }

  return 'en';
};

const sendResponse = (res, success, statusCode, message, data = null, language = null) => {
  const req = res?.req;
  const cleanLang = getRequestLanguage(req, language || res?.locals?.language);

  return res.status(statusCode).json({
    success: success,
    status: statusCode,
    language: cleanLang,
    message: message,
    data: data !== null && data !== undefined ? data : undefined,
  });
};

// General error handling function
const handleError = (res, statusCode, message, language = null) => {
  return sendResponse(res, false, statusCode, message, null, language);
};

// Success handler function
const handleSuccess = (res, statusCode, message, data = null, language = null) => {
  return sendResponse(res, true, statusCode, message, data, language);
};

export const handleSuccessNew = (res, status, message, data = {}) => {
  const cleanLang = getRequestLanguage(res?.req, res?.locals?.language);
  return res.status(status).json({
    success: true,
    status,
    language: cleanLang,
    message,
    ...data, // <-- Spread the object instead of nesting it
  });
};

// Validation error handler
const vallidationErrorHandle = (res, error, language = null) => {
  let errorMessage = 'Validation error';
  if (error && typeof error.array === 'function') {
    const arr = error.array();
    if (arr.length > 0) errorMessage = arr[0].msg;
  } else if (error && Array.isArray(error.errors) && error.errors.length > 0) {
    errorMessage = error.errors[0].msg;
  }
  return sendResponse(res, false, 400, errorMessage, null, language);
};

const joiErrorHandle = (res, error, language = null) => {
  const cleanLang = getRequestLanguage(res?.req, language || res?.locals?.language);
  return res.status(200).send({
    success: false,
    status: 400,
    language: cleanLang,
    message: error.details[0].message
  });
};

// Export the functions for reuse
export { handleError, handleSuccess, vallidationErrorHandle, joiErrorHandle };