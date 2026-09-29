import jwt from 'jsonwebtoken';
import { handleError } from '../utils/responseHandler.js';
import dotenv from 'dotenv';
import { fetchAdminById } from '../models/admin.model.js';
import { variableTypes } from '../utils/constant.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
      return handleError(res, 401, variableTypes.NO_TOKEN_PROVIDED);
    }
    const tokenParts = authorizationHeader.split(' ');
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return handleError(res, 401, variableTypes.INVALID_OR_MISSING_TOKEN);
    }
    const token = tokenParts[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return handleError(res, 401, variableTypes.INVALID_TOKEN);
    }
    const admin = await fetchAdminById(decodedToken.id)
    // if (admin.length>0) 
    if(!admin){
      return handleError(res, 404, variableTypes.USER_NOT_FOUND);
    }
    req.admin = admin;
    next();
  } catch (error) {
    return handleError(res, 500, variableTypes.INTERNAL_SERVER_ERROR);
  }
};