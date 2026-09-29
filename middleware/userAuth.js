import jwt from 'jsonwebtoken';
import { handleError } from '../utils/responseHandler.js';
import dotenv from 'dotenv';
import { fetchRoleByUsersId, fetchUsersById } from '../models/user.model.js';
import { variableTypes } from '../utils/constant.js';
import { getMessage } from '../utils/user_helper.js';

dotenv.config();

const JWT_SECRET = process.env.AUTH_SECRETKEY;
const JWT_SECRET_ADMIN = process.env.JWT_SECRET;

export const authenticateUser = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers[variableTypes.AUTHORIZATION];
    if (!authorizationHeader) {
      return handleError(res, 401, getMessage('en', variableTypes.NO_TOKEN_PROVIDED), []);
    }
    const tokenParts = authorizationHeader.split(' ');
    if (tokenParts[0] !== variableTypes.BEARER || !tokenParts[1]) {
      return handleError(res, 401, getMessage('en', variableTypes.INVALID_OR_MISSING_TOKEN), []);
    }
    const token = tokenParts[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return handleError(res, 401, getMessage('en', variableTypes.INVALID_TOKEN), []);

    }
    const [user] = await fetchUsersById(decodedToken.data.id)
    let isUserBlocked = await fetchRoleByUsersId(decodedToken.data.id, decodedToken.data.role);

    if (isUserBlocked.length > 0 && isUserBlocked[0].isBlocked == 1) {
      return handleError(res, 404, getMessage(user.language, variableTypes.USER_BLOCKED_BY_ADMIN), []);
    }

    if (!user) {
      return handleError(res, 404, getMessage('en', variableTypes.USER_NOT_FOUND), []);
    }
    req.user = user;
    res.locals.language = user.language || 'en';
    next();
  } catch (error) {
    console.log("here", error)
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};