import { firebaseMessaging } from '../config/firebase.js';
import { getAllUserFcmTokensModel, getUserById } from '../models/notification.model.js';
import { insertUserNotifications } from '../models/user.model.js';
import { canUserReceiveNotification } from '../models/user/notificationSettings.model.js';
import { getNotificationTranslation, notificationTranslations } from './notificationTranslations.js';
import { getChfFormattedPrice } from '../utils/user_helper.js';
export * from './notificationTranslations.js';
export * from './notificationDispatchers.js';

export const sendCarListedNotification = async ({
    carId,
    senderId = null
}) => {
    try {
        if (!carId) {
            console.warn("Car listed notification skipped: carId missing");

            return {
                success: false,
                reason: "Missing carId"
            };
        }

        const rawUsers = await getAllUserFcmTokensModel(senderId);

        const usersArray = Array.isArray(rawUsers)
            ? rawUsers
            : (rawUsers ? [rawUsers] : []);

        const userList = usersArray.filter(
            (user) =>
                user &&
                user.id &&
                (!senderId || Number(user.id) !== Number(senderId)) &&
                user.fcmToken &&
                String(user.fcmToken).trim() !== ""
        );

        if (!userList.length) {
            console.warn("No eligible notification recipients found");

            return {
                success: false,
                reason: "No eligible recipients found"
            };
        }

        // ============================================
        // FIREBASE NOTIFICATIONS
        // ============================================

        const messages = userList.map((user) => {
            const language = user.language || "en";

            const translated = getNotificationTranslation(
                language,
                "NEW_CAR_LISTED",
                "NEW_CAR_LISTED_BODY",
                {}
            );

            return {
                token: String(user.fcmToken).trim(),

                notification: {
                    title: translated.title,
                    body: translated.body
                },

                // data: {
                //     type: "car_listed",
                //     car_id: String(carId)
                // },
                data: {
                    title: String(translated.title),
                    body: String(translated.body),
                    type: "car_listed",
                    notification_type: "car_listed",
                    id: String(carId),
                    car_id: String(carId)
                },

                android: {
                    priority: "high",
                    notification: {
                        sound: "default"
                    }
                },

                apns: {
                    payload: {
                        aps: {
                            sound: "default"
                        }
                    }
                }
            };
        });

        const batchSize = 500;

        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);

            const response = await firebaseMessaging.sendEach(batch);

            successCount += response.successCount;
            failureCount += response.failureCount;

            console.log(
                `Notification batch: ${response.successCount} successful, ` +
                `${response.failureCount} failed`
            );
        }

        console.log(
            `Car listed Firebase notification completed for car ${carId}. ` +
            `Success: ${successCount}, Failed: ${failureCount}`
        );

  // ============================================
// DATABASE NOTIFICATIONS
// ============================================

let dbInsertedCount = 0;

for (const user of userList) {
    try {
        // DB notification should always be stored
        // in the default/canonical language.
        const dbTranslated = getNotificationTranslation(
            "en",
            "NEW_CAR_LISTED",
            "NEW_CAR_LISTED_BODY",
            {}
        );

        const dbNotification = {
            data: {
                sendFrom: senderId
                    ? Number(senderId)
                    : null,

                sendTo: Number(user.id),

                notificationType: "car_listed",

                carId: Number(carId),

                isSendTo: 1
            },

            notification: {
                title: dbTranslated.title,
                body: dbTranslated.body
            }
        };

        await insertUserNotifications(
            dbNotification,
            "success"
        );

        dbInsertedCount++;

    } catch (dbError) {
        console.error(
            `Failed to insert DB notification for user ${user.id}:`,
            dbError
        );
    }
}

        console.log(
            `Car listed DB notifications inserted: ` +
            `${dbInsertedCount} records for car ${carId}.`
        );

        return {
            success: true,
            successCount,
            failureCount,
            dbInsertedCount
        };

    } catch (error) {
        console.error(
            `Failed to send car listed notification for car ${carId}:`,
            error
        );

        return {
            success: false,
            reason: error.message
        };
    }
};

export const sendChatNotification = async ({
    userId,
    senderId = null,
    chatId = null,
    body,
    carDetails = null,
    senderName = "New Message",
}) => {
    try {
        if (!userId) {
            console.warn("Chat notification skipped: userId missing");

            return {
                success: false,
                reason: "Missing userId",
            };
        }

        if (!body || String(body).trim() === "") {
            console.warn("Chat notification skipped: body missing");

            return {
                success: false,
                reason: "Missing message body",
            };
        }

        // ============================================
        // PREVENT NOTIFICATION TO SELF
        // ============================================

        if (
            senderId &&
            Number(userId) === Number(senderId)
        ) {
            console.warn(
                `Chat notification skipped: sender ${senderId} is the same as receiver ${userId}`
            );

            return {
                success: false,
                reason: "Sender and receiver cannot be the same",
            };
        }

        // ============================================
        // GET RECEIVER
        // ============================================

        const user = await getUserById(userId);

        if (!user) {
            console.warn(
                `User not found for notification: ${userId}`
            );

            return {
                success: false,
                reason: "User not found",
            };
        }

        const allowed = await canUserReceiveNotification(userId, 'chat_messages');
        if (!allowed) {
            console.log(`User ${userId} has disabled chat message notifications`);
            return {
                success: false,
                reason: "User disabled chat notifications",
            };
        }

        // ============================================
        // FCM TOKEN
        // ============================================

        if (
            !user.fcmToken ||
            String(user.fcmToken).trim() === ""
        ) {
            console.warn(
                `No FCM token found for user ${userId}`
            );

            return {
                success: false,
                reason: "FCM token not found",
            };
        }

        // ============================================
        // RECEIVER LANGUAGE
        // ============================================

        const language = user.language || "en";

        // ============================================
        // CHAT TITLE
        // Sender name should be title
        // ============================================

        const title = String(senderName || "New Message").trim();

        // ============================================
        // ACTUAL CHAT MESSAGE
        // Do NOT translate chat message
        // ============================================

        const notificationBody = String(body).trim();

        // ============================================
        // CAR DETAILS
        // FCM DATA VALUES MUST BE STRINGS
        // ============================================

        const serializedCarDetails = carDetails
            ? JSON.stringify(carDetails)
            : "";

        // ============================================
        // FIREBASE PAYLOAD
        // Same pattern as physical visit
        // ============================================

        const payload = {
            token: String(user.fcmToken).trim(),

            notification: {
                title,
                body: notificationBody,
            },

            data: {
                type: "chat",

                notification_type: "chat",

                id: chatId
                    ? String(chatId)
                    : "",

                chat_id: chatId
                    ? String(chatId)
                    : "",

                sender_id: senderId
                    ? String(senderId)
                    : "",

                receiver_id: String(userId),

                body: notificationBody,

                car_details: serializedCarDetails,

                sendFrom: senderId
                    ? String(senderId)
                    : "",

                sendTo: String(userId),
            },

            android: {
                priority: "high",

                notification: {
                    sound: "default",
                },
            },

            apns: {
                payload: {
                    aps: {
                        sound: "default",
                    },
                },
            },
        };

        // ============================================
        // FIREBASE ONLY
        // NO DATABASE INSERT FOR CHAT
        // ============================================

        const response = await firebaseMessaging.send(payload);

        console.log(
            `✅ Chat notification sent to user ${userId}: ${response}`
        );

        return {
            success: true,
            messageId: response,
        };

    } catch (error) {
        console.error(
            `❌ Error sending chat notification to user ${userId}:`,
            error.message
        );

        return {
            success: false,
            reason: error.message,
        };
    }
};

export const sendNotificationToUser = async (userId, message) => {
    try {
        if (!userId || !message) {
            console.warn("Notification skipped: userId or message missing");

            return {
                success: false,
                reason: "Missing userId or message"
            };
        }

        // ============================================
        // GET RECEIVER
        // ============================================

        const user = await getUserById(userId);

        if (!user) {
            console.warn(
                `User not found for notification: ${userId}`
            );

            return {
                success: false,
                reason: "User not found"
            };
        }

        // ============================================
        // CHECK USER NOTIFICATION SETTINGS
        // ============================================

        const category = message.category || message.data?.category || 'general';
        const isAllowed = await canUserReceiveNotification(userId, category);
        if (!isAllowed) {
            console.log(
                `Notification skipped for user ${userId}: category "${category}" is opted-out in settings.`
            );
            return {
                success: false,
                reason: `Opted-out of category ${category}`
            };
        }

        // ============================================
        // RECEIVER LANGUAGE
        // ============================================

        const language = user.language || "en";

        const translated = getNotificationTranslation(
            language,
            message.titleKey,
            message.bodyKey,
            message.params || {}
        );

        const title = translated.title;
        const body = translated.body;

        const notificationType =
            message.data?.type || "general";

        // ============================================
        // 1. FIREBASE NOTIFICATION
        // Only if FCM token exists
        // ============================================

        let firebaseResponse = null;

        if (
            user.fcmToken &&
            String(user.fcmToken).trim() !== ""
        ) {
            const payload = {
                token: String(user.fcmToken).trim(),

                notification: {
                    title,
                    body
                },

                data: {
                    title: String(title),
                    body: String(body),
                    titleKey: String(message.titleKey || ''),
                    bodyKey: String(message.bodyKey || ''),
                    ...Object.fromEntries(
                        Object.entries(message.data || {}).map(
                            ([key, value]) => [
                                key,
                                String(value ?? "")
                            ]
                        )
                    )
                },

                android: {
                    priority: "high",

                    notification: {
                        sound: "default"
                    }
                },

                apns: {
                    payload: {
                        aps: {
                            sound: "default"
                        }
                    }
                }
            };

            try {
                firebaseResponse =
                    await firebaseMessaging.send(payload);

                console.log(
                    `✅ Firebase notification sent to user ${userId}: ${firebaseResponse}`
                );
            } catch (firebaseError) {
                // Firebase failure should NOT stop DB insertion
                console.error(
                    `❌ Firebase notification failed for user ${userId}:`,
                    firebaseError
                );
            }
        } else {
            console.warn(
                `⚠️ No FCM token found for user ${userId}. Skipping Firebase notification.`
            );
        }

// ============================================
// 2. DATABASE NOTIFICATION
// ALWAYS INSERT
// ============================================

try {
    // DB notification should always be stored
    // in the default/canonical language.
    const dbTranslated = getNotificationTranslation(
        "en",
        message.titleKey,
        message.bodyKey,
        message.params || {}
    );

    await insertUserNotifications(
        {
            data: {
                sendFrom: message.data?.sendFrom
                    ? Number(message.data.sendFrom)
                    : null,

                sendTo: Number(userId),

                notificationType,

                carId: (message.data?.carId || message.data?.car_id)
                    ? Number(message.data?.carId || message.data?.car_id)
                    : null,

                isSendTo: 1
            },

            notification: {
                title: dbTranslated.title,
                body: dbTranslated.body
            }
        },
        "success"
    );

    console.log(
        `✅ Notification DB entry inserted for user ${userId}`
    );

} catch (dbError) {
    console.error(
        `❌ Failed to insert notification in DB for user ${userId}:`,
        dbError
    );
}

        return {
            success: true,
            messageId: firebaseResponse
        };

    } catch (error) {
        console.error(
            `❌ Error processing notification for user ${userId}:`,
            error.message
        );

        return {
            success: false,
            reason: error.message
        };
    }
};




// export const sendPurchaseAgreementNotification = async ({
//     agreementId,
//     senderId,
//     receiverId,
//     carId,
//     carName,
//     senderName,
//     salePrice,
//     counterPrice
// }) => {
//     try {
//         console.log('==========================================');
//         console.log('Purchase Agreement Notification Started');
//         console.log('Agreement ID:', agreementId);
//         console.log('Sender ID:', senderId);
//         console.log('Receiver ID:', receiverId);
//         console.log('Sender Name:', senderName);
//         console.log('Car Name:', carName);
//         console.log('Counter Price:', counterPrice);
//         console.log('==========================================');

//         if (!agreementId || !receiverId) {
//             console.warn(
//                 'Purchase agreement notification skipped: missing data',
//                 {
//                     agreementId,
//                     receiverId
//                 }
//             );

//             return {
//                 success: false,
//                 reason: 'Missing agreementId or receiverId'
//             };
//         }

//         // =========================
//         // Get Receiver / Seller
//         // =========================

//         console.log(
//             `Fetching receiver user data for: ${receiverId}`
//         );

//         const user = await getUserById(receiverId);

//         console.log(
//             'Receiver user:',
//             user
//         );

//         if (!user) {
//             console.warn(
//                 `Receiver ${receiverId} not found for purchase agreement notification`
//             );

//             return {
//                 success: false,
//                 reason: 'Receiver not found'
//             };
//         }

//         const language =
//             user.language || 'en';

//         console.log(
//             'Receiver language:',
//             language
//         );

//         // =========================
//         // Notification Translation
//         // =========================

//         const offeredPrice =
//     counterPrice !== null &&
//     counterPrice !== undefined
//         ? counterPrice
//         : salePrice;

// const translated =
//     getNotificationTranslation(
//         language,
//         'NEW_PURCHASE_AGREEMENT',
//         'NEW_PURCHASE_AGREEMENT_BODY',
//         {
//             name: senderName || 'Buyer',
//             car: carName,
//             offeredPrice
//         }
//     );

//         console.log(
//             'Notification translation:',
//             translated
//         );

//         // =========================
//         // Firebase Notification
//         // =========================

//         let firebaseSuccess = false;

//         if (
//             user.fcmToken &&
//             String(user.fcmToken).trim() !== ''
//         ) {
//             console.log(
//                 `Sending Firebase notification to receiver ${receiverId}`
//             );

//             const message = {
//                 token: String(
//                     user.fcmToken
//                 ).trim(),

//                 notification: {
//                     title: translated.title,
//                     body: translated.body
//                 },

//                 data: {
//                     type: 'purchase_agreement',
//                     notification_type:
//                         'purchase_agreement',

//                     id: String(
//                         agreementId
//                     ),

//                     agreement_id: String(
//                         agreementId
//                     )
//                 },

//                 android: {
//                     priority: 'high',

//                     notification: {
//                         sound: 'default'
//                     }
//                 },

//                 apns: {
//                     payload: {
//                         aps: {
//                             sound: 'default'
//                         }
//                     }
//                 }
//             };

//             console.log(
//                 'Firebase message:',
//                 message
//             );

//             try {
//                 const firebaseResponse =
//                     await firebaseMessaging.send(
//                         message
//                     );

//                 firebaseSuccess = true;

//                 console.log(
//                     'Firebase notification sent successfully:',
//                     firebaseResponse
//                 );

//             } catch (firebaseError) {
//                 console.error(
//                     `Failed to send Firebase notification to receiver ${receiverId}:`,
//                     firebaseError
//                 );
//             }

//         } else {
//             console.warn(
//                 `No FCM token found for receiver ${receiverId}`
//             );
//         }

//   // =========================
// // Database Notification
// // =========================

// let dbInserted = false;

// try {
//     console.log(
//         `Inserting notification into DB for receiver ${receiverId}`
//     );

//     // DB notification should always be stored
//     // in the default/canonical language (English).
//     const dbTranslated =
//         getNotificationTranslation(
//             'en',
//             'NEW_PURCHASE_AGREEMENT',
//             'NEW_PURCHASE_AGREEMENT_BODY',
//             {
//                 name: senderName || 'Buyer',
//                 car: carName,
//                 offeredPrice
//             }
//         );

//    const dbNotification = {
//     data: {
//         sendFrom: senderId
//             ? Number(senderId)
//             : null,

//         sendTo: Number(receiverId),

//         notificationType:
//             'purchase_agreement',

//         carId:
//             carId
//                 ? Number(carId)
//                 : null,

//         purchaseAgreementId:
//             Number(agreementId),

//         isSendTo: 1
//     },

//     notification: {
//         title: dbTranslated.title,
//         body: dbTranslated.body
//     }
// };

//     console.log(
//         'DB notification payload:',
//         dbNotification
//     );

//     await insertUserNotifications(
//         dbNotification,
//         'success'
//     );

//     dbInserted = true;

//     console.log(
//         'DB notification inserted successfully'
//     );

// } catch (dbError) {
//     console.error(
//         `Failed to insert DB notification for receiver ${receiverId}:`,
//         dbError
//     );
// }

//         // =========================
//         // Completed
//         // =========================

//         console.log(
//             '=========================================='
//         );

//         console.log(
//             'Purchase Agreement Notification Completed'
//         );

//         console.log(
//             'Agreement ID:',
//             agreementId
//         );

//         console.log(
//             'Firebase Success:',
//             firebaseSuccess
//         );

//         console.log(
//             'DB Inserted:',
//             dbInserted
//         );

//         console.log(
//             '=========================================='
//         );

//         return {
//             success: true,
//             firebaseSuccess,
//             dbInserted
//         };

//     } catch (error) {
//         console.error(
//             `Failed to send purchase agreement notification for agreement ${agreementId}:`,
//             error
//         );

//         return {
//             success: false,
//             reason: error.message
//         };
//     }
// };

export const sendPurchaseAgreementNotification = async ({
    agreementId,
    senderId = null,
    receiverId,
    carId = null,
    carName = 'car',
    senderName = null,
    salePrice = null,
    counterPrice = null,
    titleKey = 'NEW_PURCHASE_AGREEMENT',
    bodyKey = 'NEW_PURCHASE_AGREEMENT_BODY',
    notificationType = 'purchase_agreement'
}) => {
    try {
        console.log('==========================================');
        console.log('Purchase Agreement Notification Started');
        console.log('Agreement ID:', agreementId);
        console.log('Sender ID:', senderId);
        console.log('Receiver ID:', receiverId);
        console.log('Sender Name:', senderName);
        console.log('Car ID:', carId);
        console.log('Car Name:', carName);
        console.log('Sale Price:', salePrice);
        console.log('Counter Price:', counterPrice);
        console.log('Notification Type:', notificationType);
        console.log('==========================================');

        // =========================================
        // VALIDATION
        // =========================================

        if (!agreementId || !receiverId) {
            console.warn(
                'Purchase agreement notification skipped: missing data',
                {
                    agreementId,
                    receiverId
                }
            );

            return {
                success: false,
                reason: 'Missing agreementId or receiverId'
            };
        }

        // =========================================
        // GET RECEIVER
        // =========================================

        const receiverUser =
            await getUserById(receiverId);

        console.log(
            'Receiver user:',
            receiverUser
        );

        if (!receiverUser) {
            console.warn(
                `Receiver ${receiverId} not found`
            );

            return {
                success: false,
                reason: 'Receiver not found'
            };
        }

        // =========================================
        // GET SENDER
        // =========================================

        let finalSenderName = senderName;

        if (senderId) {
            try {
                const senderUser =
                    await getUserById(senderId);

                console.log(
                    'Sender user:',
                    senderUser
                );

                if (senderUser) {
                    finalSenderName =
                        senderUser.fullName ||
                        senderUser.full_name ||
                        senderUser.fullname ||
                        senderUser.name ||
                        finalSenderName;
                }

            } catch (senderError) {
                console.error(
                    `Failed to fetch sender ${senderId}:`,
                    senderError
                );
            }
        }

        finalSenderName =
            finalSenderName || 'Seller';

        console.log(
            'Final Sender Name:',
            finalSenderName
        );

        // =========================================
        // RECEIVER LANGUAGE
        // =========================================

        const language =
            receiverUser.language || 'en';

        console.log(
            'Receiver language:',
            language
        );

        // =========================================
        // OFFERED PRICE
        // =========================================

        const offeredPrice =
            counterPrice !== null &&
            counterPrice !== undefined
                ? counterPrice
                : salePrice;

        const formattedOfferedPrice =
            offeredPrice !== null && offeredPrice !== undefined && offeredPrice !== ''
                ? getChfFormattedPrice(offeredPrice)
                : offeredPrice;

        // =========================================
        // TRANSLATION
        // =========================================

        const translated =
            getNotificationTranslation(
                language,
                titleKey,
                bodyKey,
                {
                    name: finalSenderName,
                    car: carName || 'car',
                    offeredPrice: formattedOfferedPrice
                }
            );

        console.log(
            'Notification translation:',
            translated
        );

        // =========================================
        // FIREBASE NOTIFICATION
        // =========================================

        let firebaseSuccess = false;
        let firebaseResponse = null;

        if (
            receiverUser.fcmToken &&
            String(receiverUser.fcmToken).trim() !== ''
        ) {
            const message = {
                token: String(
                    receiverUser.fcmToken
                ).trim(),

                notification: {
                    title: translated.title,
                    body: translated.body
                },

                data: {
                    title: String(translated.title),
                    body: String(translated.body),
                    type: notificationType,

                    notification_type:
                        notificationType,

                    id: String(
                        agreementId
                    ),

                    agreement_id: String(
                        agreementId
                    ),

                    car_id: carId
                        ? String(carId)
                        : '',

                    sender_id: senderId
                        ? String(senderId)
                        : '',

                    receiver_id:
                        String(receiverId)
                },

                android: {
                    priority: 'high',

                    notification: {
                        sound: 'default'
                    }
                },

                apns: {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            };

            try {
                firebaseResponse =
                    await firebaseMessaging.send(
                        message
                    );

                firebaseSuccess = true;

                console.log(
                    'Firebase notification sent successfully:',
                    firebaseResponse
                );

            } catch (firebaseError) {
                console.error(
                    `Failed to send Firebase notification to receiver ${receiverId}:`,
                    firebaseError
                );
            }

        } else {
            console.warn(
                `No FCM token found for receiver ${receiverId}`
            );
        }

        // =========================================
        // DATABASE NOTIFICATION
        // =========================================

        let dbInserted = false;

        try {
            // Always save DB notification in English
            const dbTranslated =
                getNotificationTranslation(
                    'en',
                    titleKey,
                    bodyKey,
                    {
                        name: finalSenderName,
                        car: carName || 'car',
                        offeredPrice: formattedOfferedPrice
                    }
                );

            const dbNotification = {
                data: {
                    sendFrom: senderId
                        ? Number(senderId)
                        : null,

                    sendTo:
                        Number(receiverId),

                    notificationType,

                    carId: carId
                        ? Number(carId)
                        : null,

                    purchaseAgreementId:
                        Number(agreementId),

                    isSendTo: 1
                },

                notification: {
                    title:
                        dbTranslated.title,

                    body:
                        dbTranslated.body
                }
            };

            console.log(
                'DB notification payload:',
                dbNotification
            );

            await insertUserNotifications(
                dbNotification,
                'success'
            );

            dbInserted = true;

            console.log(
                'DB notification inserted successfully'
            );

        } catch (dbError) {
            console.error(
                `Failed to insert notification into DB for receiver ${receiverId}:`,
                dbError
            );
        }

        // =========================================
        // COMPLETED
        // =========================================

        console.log('==========================================');
        console.log(
            'Purchase Agreement Notification Completed'
        );
        console.log(
            'Agreement ID:',
            agreementId
        );
        console.log(
            'Firebase Success:',
            firebaseSuccess
        );
        console.log(
            'DB Inserted:',
            dbInserted
        );
        console.log('==========================================');

        return {
            success: true,
            firebaseSuccess,
            dbInserted,
            messageId: firebaseResponse
        };

    } catch (error) {
        console.error(
            `Failed to send purchase agreement notification for agreement ${agreementId}:`,
            error
        );

        return {
            success: false,
            reason: error.message
        };
    }
};
