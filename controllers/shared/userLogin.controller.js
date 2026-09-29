import { fetchUsersByEmail, createUserByEmail, insertUserRole, isUsersExistsOrNot, updateUsersProfile, fetchUsersById } from '../../models/user.model.js';
import jwt from 'jsonwebtoken';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { authenticateUser, getMessage } from '../../utils/user_helper.js';

export const socialLogin = async (req, res) => {
    try {
        const { email, fullName, isSeller } = req.body;

        if (!email || !fullName || typeof isSeller === "undefined") {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Required fields missing",
            });
        }

        let user = await fetchUsersByEmail(email);
        console.log("Fetched user:", user);

        let isNewUser = false;

        if (!user || user.length === 0) {
            console.log('Creating new user for social login...');
            await createUserByEmail(email, fullName, isSeller);

            user = await fetchUsersByEmail(email);
            if (!user || user.length === 0) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: "User creation failed",
                });
            }

            isNewUser = true;
        }

        const selectedUser = user[0];
        const userId = selectedUser.id;

        if (isNewUser) {
            const rolePayload = {
                user_id: userId,
                role: isSeller == 1 ? 'seller' : 'buyer',
                seller_type: isSeller == 1 ? 'personal' : null,
                is_active: 1,
            };

            console.log("Inserting role for new user:", rolePayload);
            await insertUserRole(rolePayload);
        }

        const token = jwt.sign(
            {
                data: {
                    id: selectedUser.id,
                    email: selectedUser.email,
                    role: isSeller == 1 ? "seller" : "buyer"
                }
            },
            process.env.AUTH_SECRETKEY,
            { expiresIn: "7d" }
        );

        // // Generate token
        //     {
        //         userId: selectedUser.id,
        //         email: selectedUser.email,
        //         isSeller: selectedUser.isSeller == 1,
        //     },
        //     SECRET_KEY,
        //     { expiresIn: "7d" }
        // );

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Login successful",
            token,
            user: selectedUser,
        });

    } catch (error) {
        console.error("Social Login Error:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const userSignIn = async (req, res) => {
    try {
        const moduleType = "userLogin";
        const { email, password, fcmToken, location, language } = req.body;
        const formattedLocation =
            typeof location === 'string' ? location : JSON.stringify(location);
        const isDirectSignup = 0;

        const userData = await isUsersExistsOrNot(email);
        const lang = language || userData?.[0]?.language || "en";

        if (userData.length === 0) {
            return handleError(res, 400, getMessage(lang, variableTypes.ACCOUNT_NOT_FOUND), []);
        }

        const user = userData[0];

        if (user.isVerified !== 1) {
            return handleError(res, 400, getMessage(lang, variableTypes.VERIFY_YOUR_ACCOUNT), []);
        }

        await updateUsersProfile(
            {
                email,
                ...(formattedLocation ? { location: formattedLocation } : {}),
                language: lang
            },
            user.id
        );

        const fetchUsersDetailed = await fetchUsersById(user.id);
        const role = "user";

        await authenticateUser(
            res,
            lang,
            password,
            fetchUsersDetailed,
            fcmToken,
            moduleType,
            isDirectSignup,
            role
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
