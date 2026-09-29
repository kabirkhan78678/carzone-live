import { fetchUsersById, updateUsersProfile, replaceOpeningTimes, replaceAdvantages, replaceServices, syncTeamMembers, replaceShowroomImages, replaceShowroomVideos } from '../../models/user.model.js';
import path from 'path';
import fs from 'fs/promises';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { sendEmail } from '../../utils/emailService.js';
import { getMessage } from '../../utils/user_helper.js';
import { baseurl } from '../../config/path.js';

export const editProfile = async (req, res) => {
    const { id, language } = req.user;
    console.log('id', id);
    const lang = language;

    //try{
    const rows = await fetchUsersById(id);
    const user = rows[0];

    if (!user) {
        return handleError(res, 404, "User not found");
    }

    let profileImage = user.profileImage;
    const profileImageFile = req.files?.find(file => file.fieldname === 'profileImage');
    if (profileImageFile) {
        profileImage = `${baseurl}/profile/${profileImageFile.filename}`;
    }

    let coverImage = user.coverImage;
    const coverImageFile = req.files?.find(file => file.fieldname === 'coverImage');
    if (coverImageFile) {
        console.log("coverImageFile.filename", coverImageFile.filename);
        coverImage = `${baseurl}/profile/${coverImageFile.filename}`;
    }

    console.log("coverImage", coverImage);

    const {
        fullName,
        phoneNumber,
        businessPhone,
        businessCountryCode,
        mobilePhone,
        whatsappNumber,
        whatsappCountryCode,
        countryCode,
        fullAddress,
        location,
        companyName,
        companyAddress,
        account_type,
        vat,
        city,
        pincode,
        websiteUrl,
        tagline,
        description,
        openingTimes,
        advantages,
        services,
        teamMembers,
        seller_type,
        legalForm,
        commercialRegisterNumber,
    } = req.body;
    const requestedAccountType =
        account_type === "private" || account_type === "company"
            ? account_type
            : user.account_type;
    const isSwitchingPrivateToCompany =
        user.account_type === "private" && requestedAccountType === "company";

    const resolvedBusinessPhone =
        businessPhone ??
        (requestedAccountType === "company"
            ? (user.business_phone ?? null)
            : (user.business_phone ?? null));

    const resolvedPrimaryPhone =
        phoneNumber ??
        (requestedAccountType === "company"
            ? (mobilePhone ?? user.phoneNumber)
            : user.phoneNumber);

    const userProfilePayload = {
        fullName:
            requestedAccountType === "company"
                ? (companyName ?? fullName ?? user.fullName)
                : (fullName ?? user.fullName),
        phoneNumber: resolvedPrimaryPhone,
        business_phone: resolvedBusinessPhone,
        businessCountryCode: businessCountryCode ?? user.businessCountryCode,
        countryCode: countryCode ?? user.countryCode,
        whatsappCountryCode: whatsappCountryCode ?? user.whatsappCountryCode,
        legalForm: legalForm ?? user.legalForm,
        whatsappNumber: whatsappNumber ?? user.whatsappNumber,
        fullAddress: fullAddress ?? user.fullAddress,
        location:
            typeof location === "string"
                ? location
                : location
                    ? JSON.stringify(location)
                    : user.location,

        profileImage,
        coverImage,

        companyName: companyName ?? user.companyName,
        companyAddress: companyAddress ?? user.companyAddress,
        account_type: requestedAccountType,
        is_activated: isSwitchingPrivateToCompany ? 0 : user.is_activated,
        vat: vat ?? user.vat,
        city: city ?? user.city,
        pincode: pincode ?? user.pincode,
        websiteUrl: websiteUrl ?? user.websiteUrl,
        tagline: tagline ?? user.tagline,
        description: description ?? user.description,
        updatedAt: new Date(),
        sellerType: seller_type,
        commercial_register_number: commercialRegisterNumber
    };

    if (req.body.dob !== undefined || req.body.dateOfBirth !== undefined || user.dob !== undefined) {
        userProfilePayload.dob = (req.body.dob !== undefined ? req.body.dob : (req.body.dateOfBirth !== undefined ? req.body.dateOfBirth : user.dob)) || null;
    }

    const result = await updateUsersProfile(userProfilePayload, id);

    // await updateSellerTypeProfile({ seller_type }, id);

    // console.log('openingTimes', openingTimes);

    if (openingTimes) {
        const parsed =
            typeof openingTimes === "string"
                ? JSON.parse(openingTimes)
                : openingTimes;

        await replaceOpeningTimes(id, parsed);
    }

    if (advantages) {
        const parsed =
            typeof advantages === "string"
                ? JSON.parse(advantages)
                : advantages;

        await replaceAdvantages(id, parsed);
    }

    if (services) {
        const parsed =
            typeof services === "string"
                ? JSON.parse(services)
                : services;

        await replaceServices(id, parsed);
    }

    // old code by beauty mam
    //         typeof teamMembers === "string"
    //             ? JSON.parse(teamMembers)
    //             : teamMembers;
    //
    //         await replaceTeamMembers(id, parsed);
    //     }
    // }

    // code by raj (FIXED – image safe update)
    if (teamMembers) {
        const uploadDir = path.join(process.cwd(), "public/profile");

        const parsed =
            typeof teamMembers === "string"
                ? JSON.parse(teamMembers)
                : teamMembers;

        if (Array.isArray(parsed) && parsed.length && Array.isArray(req.files)) {
            for (const member of parsed) {
                if (!member) continue;

                const identity = member.id
                    ? `member_${member.id}`
                    : member.tempKey
                        ? `member_${member.tempKey}`
                        : null;

                if (!identity) continue;

                const file = req.files.find(f => f.fieldname === identity);
                console.log(file);

                //  IMPORTANT FIX:
                // Agar image nahi aayi → kuch bhi mat karo
                if (!file) {
                    delete member.profilePhoto; // ⬅️ YE LINE FIX HAI
                    continue;
                }

                //  OLD IMAGE DELETE (sirf jab new image aayi ho)
                if (member.profilePhoto) {
                    try {
                        const oldFile = member.profilePhoto.split("/profile/")[1];
                        if (oldFile) {
                            const oldPath = path.join(uploadDir, oldFile);
                            if (fs.existsSync(oldPath)) {
                                fs.unlinkSync(oldPath);
                            }
                        }
                    } catch (err) {
                        console.warn("Old image delete failed:", err.message);
                    }
                }

                // ✅ NEW IMAGE SET
                member.profilePhoto = `${baseurl}/profile/${file.filename}`;
            }
        }

        if (parsed.length) {
            await syncTeamMembers(id, parsed);
        }
    }

    if (isSwitchingPrivateToCompany) {
        await sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: "New Company Registration Submitted",
            html: `
                <h3>New company registration submitted</h3>
                <p><strong>Company Name:</strong> ${companyName ?? user.companyName ?? "N/A"}</p>
                <p><strong>Commercial Register Number:</strong> ${user.uid || "N/A"}</p>
                <p><strong>Company Address:</strong> ${companyAddress ?? user.companyAddress ?? "N/A"}</p>
                <p><strong>City:</strong> ${city ?? user.city ?? "N/A"}</p>
                <p><strong>Postal Code:</strong> ${pincode ?? user.pincode ?? "N/A"}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Business Phone:</strong> ${resolvedBusinessPhone ?? "N/A"}</p>
                <p><strong>Mobile Phone:</strong> ${resolvedPrimaryPhone ?? "N/A"}</p>
                <p><strong>WhatsApp Number:</strong> ${whatsappNumber ?? user.whatsappNumber ?? "N/A"}</p>
            `
        });
    }

    const showroomImageFiles = req.files?.filter(file => file.fieldname === 'showroomImages') || [];
    if (showroomImageFiles.length) {
        const images = showroomImageFiles.map(file => ({
            imageUrl: `${baseurl}/profile/${file.filename}`
        }));

        await replaceShowroomImages(id, images);
    }

    const showroomVideoFiles = req.files?.filter(file => file.fieldname === 'showroomVideos') || [];
    if (showroomVideoFiles.length) {
        const videos = showroomVideoFiles.map(file => ({
            videoUrl: `${baseurl}/profile/${file.filename}`
        }));

        await replaceShowroomVideos(id, videos);
    }

    return handleSuccess(
        res,
        200,
        getMessage(lang, variableTypes.PROFILE_UPDATED_SUCCESSFULLY)
    );

};

//         // --------------------------------------------------s3 code comments--------------------------------------//

//         // if (req.files) {
//         //     if (req.files.profileImage && isUserExists.profileImage) { await deleteFromS3(isUserExists.profileImage) }
//         //     profileImg = req.files.profileImage ? getPublicUrl(req.files.profileImage[0].key) : isUserExists.profileImage;
//         // }

//         //--------------------------------------------------------code-------------------------------------------------// 

//             profileImg = req.files.profileImage ? `${baseurl}/profile/${req.files.profileImage[0].filename}` : isUserExists.profileImage;
//         }
//         req.body.profileImage = profileImg
//     } catch (err) {
//         console.error(err);
//     }
// };
