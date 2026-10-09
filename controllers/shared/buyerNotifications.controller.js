import { getNotificationTranslation } from '../../services/notification.service.js';
import { getUserById } from '../../models/admin.model.js';
import { modelfetchNotificationByBuyersIds, getCarDetailsById, getExistingPurchaseAgreement, getPhysicalVisitForNotificationModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, getRequestLanguage } from '../../utils/responseHandler.js';
import { getMessage, stripHtml, getChfFormattedPrice } from '../../utils/user_helper.js';
import moment from 'moment';

export const fetchNotificationByBuyersIds = async (req, res) => {
    try {
        const { id } = req.user;
        const { isUserType } = req.query;

        // Resolve requested language with priority to query/headers/user profile
        const userLanguage = getRequestLanguage(req);

        // ============================================
        // GET NOTIFICATIONS
        // ============================================
        let rawNotifications = await modelfetchNotificationByBuyersIds(id, isUserType == 1 ? 1 : 1);
        let allNotifications = (rawNotifications || []).filter(
            (item) => String(item.notificationType || '').trim().toLowerCase() !== 'chat'
        );

        if (!allNotifications || allNotifications.length === 0) {
            return handleSuccess(
                res,
                200,
                getMessage(userLanguage, 'noNotificationYet'),
                { allNotification: [], unReadNotifications: 0, unreadCount: 0, unReadCount: 0, unread_count: 0 },
                userLanguage
            );
        }

        // ============================================
        // TRANSLATE NOTIFICATIONS
        // ============================================
        const translatedNotifications = await Promise.all(
            allNotifications.map(async (item) => {
                let titleKey = null;
                let bodyKey = null;
                let params = {};

                let title = item.title;
                let body = item.body;
                const rawType = String(item.notificationType || '').toLowerCase();
                const rawTitle = String(item.title || '').toLowerCase();
                const rawBody = String(item.body || '').toLowerCase();

                // 1. Check by Notification Type
                switch (rawType) {
                    case "car_listed":
                    case "new_car":
                    case "new_car_listed":
                        titleKey = "NEW_CAR_LISTED";
                        bodyKey = "NEW_CAR_LISTED_BODY";
                        break;

                    case "listing":
                    case "listing_published":
                    case "car_published":
                    case "listingpublished":
                    case "listing_extended":
                    case "extended":
                        try {
                            if (item.carId) {
                                const car = await getCarDetailsById(item.carId);
                                params.car = [car?.brandName, car?.carModel].filter(Boolean).join(' ') || "";
                            }
                        } catch (e) {}

                        if (rawType === "extended" || rawType === "listing_extended" || rawTitle.includes('extended') || rawTitle.includes('verlängert') || rawTitle.includes('prolongée') || rawTitle.includes('prolungato') || rawBody.includes('extended')) {
                            titleKey = "LISTING_EXTENDED";
                            bodyKey = "LISTING_EXTENDED_BODY";
                            if (!params.car) {
                                const carMatch = String(item.body || '').match(/listing\s+for\s+(.+?)\s+has\s+been/i);
                                params.car = carMatch ? carMatch[1] : "your vehicle";
                            }
                        } else if (rawTitle.includes('expired') || rawTitle.includes('abgelaufen') || rawTitle.includes('expiré') || rawBody.includes('expired')) {
                            titleKey = "LISTING_EXPIRED";
                            bodyKey = "LISTING_EXPIRED_BODY";
                        } else if (rawTitle.includes('rejected') || rawTitle.includes('abgelehnt') || rawTitle.includes('rejetée')) {
                            titleKey = "LISTING_REJECTED";
                            bodyKey = "LISTING_REJECTED_BODY";
                        } else if (rawTitle.includes('expiring soon') || rawTitle.includes('bald ab')) {
                            titleKey = "LISTING_EXPIRING_SOON";
                            bodyKey = "LISTING_EXPIRING_SOON_BODY";
                        } else {
                            titleKey = "LISTING_PUBLISHED";
                            bodyKey = "LISTING_PUBLISHED_BODY";
                            if (!params.car) {
                                const carMatch = String(item.body || '').match(/listing\s+for\s+(.+?)\s+is\s+now\s+live/i);
                                params.car = carMatch ? carMatch[1] : "Car";
                            }
                        }
                        break;

                    case "slotrequestapproved":
                    case "slot_request_approved":
                        titleKey = "SLOT_REQUEST_APPROVED";
                        bodyKey = "SLOT_REQUEST_APPROVED_BODY";
                        {
                            const slotMatch = String(item.body || '').match(/(\d+)\s+slots?/i);
                            const priceMatch = String(item.body || '').match(/price\s+of\s+([^\s.]+(?:\.\d+)?(?:.-CHF|-CHF|\s*CHF)?)/i);
                            params = {
                                slots: slotMatch ? slotMatch[1] : "",
                                price: priceMatch ? priceMatch[1] : ""
                            };
                        }
                        break;

                    case "slotrequestrejected":
                    case "slot_request_rejected":
                        titleKey = "SLOT_REQUEST_REJECTED";
                        bodyKey = "SLOT_REQUEST_REJECTED_BODY";
                        break;

                    case "sellerapproved":
                    case "seller_approved":
                        titleKey = "SELLER_APPROVED";
                        bodyKey = "SELLER_APPROVED_BODY";
                        try {
                            const sender = await getUserById(item.sendTo || id);
                            params.fullName = sender?.[0]?.fullName || sender?.fullName || "";
                        } catch (e) {}
                        break;

                    case "sellerrejected":
                    case "seller_rejected":
                        titleKey = "SELLER_REJECTED";
                        bodyKey = "SELLER_REJECTED_BODY";
                        try {
                            const sender = await getUserById(item.sendTo || id);
                            params.fullName = sender?.[0]?.fullName || sender?.fullName || "";
                        } catch (e) {}
                        break;

                    case "car_inquiry":
                    case "new_car_inquiry":
                        titleKey = "NEW_CAR_INQUIRY";
                        bodyKey = "NEW_CAR_INQUIRY_BODY";
                        try {
                            if (item.sendFrom) {
                                const sender = await getUserById(item.sendFrom);
                                params.name = sender?.[0]?.fullName || sender?.fullName || "";
                            }
                            if (item.carId) {
                                const car = await getCarDetailsById(item.carId);
                                params.car = car?.brandName || car?.carModel || "";
                            }
                        } catch (inquiryError) {}
                        if (!params.name || !params.car) {
                            const inqMatch = String(item.body || '').match(/(.+?)\s+has\s+sent\s+an\s+inquiry\s+for\s+your\s+(.+?)\.?$/i);
                            if (inqMatch) {
                                if (!params.name) params.name = inqMatch[1];
                                if (!params.car) params.car = inqMatch[2];
                            }
                        }
                        break;

                    case "purchase_agreement":
                    case "new_purchase_agreement":
                        try {
                            const agreement = await getExistingPurchaseAgreement({
                                buyer_id: item.sendFrom,
                                seller_id: item.sendTo,
                                car_id: item.carId
                            });
                            if (agreement) {
                                const buyer = await getUserById(item.sendFrom);
                                const car = await getCarDetailsById(item.carId);
                                const offeredPrice = agreement.counter_price !== null && agreement.counter_price !== undefined
                                    ? agreement.counter_price
                                    : agreement.sale_price;

                                titleKey = "NEW_PURCHASE_AGREEMENT";
                                bodyKey = "NEW_PURCHASE_AGREEMENT_BODY";
                                params = {
                                    name: buyer?.[0]?.fullName || buyer?.fullName || "Buyer",
                                    car: car?.brandName || car?.carModel || "the car",
                                    offeredPrice: offeredPrice !== null && offeredPrice !== undefined && offeredPrice !== ''
                                        ? getChfFormattedPrice(offeredPrice)
                                        : offeredPrice
                                };
                            }
                        } catch (agreementError) {}
                        if (!titleKey) {
                            titleKey = "NEW_PURCHASE_AGREEMENT";
                            bodyKey = "NEW_PURCHASE_AGREEMENT_BODY";
                            params = {
                                name: "A buyer",
                                car: "the car",
                                offeredPrice: ""
                            };
                        }
                        break;

                    case "purchase_agreement_rejected":
                        titleKey = "PURCHASE_AGREEMENT_REJECTED";
                        bodyKey = "PURCHASE_AGREEMENT_REJECTED_BODY";
                        break;

                    case "physical_visit":
                    case "visit_request":
                    case "new_visit_request":
                        try {
                            const visit = await getPhysicalVisitForNotificationModel({
                                carId: item.carId,
                                senderId: item.sendFrom,
                                receiverId: item.sendTo
                            });
                            if (visit) {
                                if (Number(visit.user_id) === Number(id)) {
                                    titleKey = "VISIT_REQUEST_SUBMITTED";
                                    bodyKey = "VISIT_REQUEST_SUBMITTED_BODY";
                                    params = {
                                        car: visit.brandName || visit.carModel || "the car",
                                        date: visit.visit_date,
                                        time: visit.visit_time
                                    };
                                } else if (Number(visit.seller_id) === Number(id)) {
                                    titleKey = "NEW_VISIT_REQUEST";
                                    bodyKey = "NEW_VISIT_REQUEST_BODY";
                                    params = {
                                        name: visit.full_name || visit.buyer_name || "User",
                                        date: visit.visit_date,
                                        time: visit.visit_time
                                    };
                                }
                            }
                        } catch (visitError) {}
                        if (!titleKey) {
                            if (rawTitle.includes('submitted') || rawBody.includes('submitted')) {
                                titleKey = "VISIT_REQUEST_SUBMITTED";
                                bodyKey = "VISIT_REQUEST_SUBMITTED_BODY";
                                const subMatch = String(item.body || '').match(/(?:appointment|visit)\s+request\s+for\s+(.+?)\s+has\s+been\s+submitted\s+for\s+([^\s]+)\s+at\s+([^\s.]+)/i);
                                if (subMatch) {
                                    params.car = subMatch[1];
                                    params.date = subMatch[2];
                                    params.time = subMatch[3];
                                }
                            } else {
                                titleKey = "NEW_VISIT_REQUEST";
                                bodyKey = "NEW_VISIT_REQUEST_BODY";
                                const reqMatch = String(item.body || '').match(/(.+?)\s+has\s+requested\s+an?\s+(?:appointment|visit)\s+for\s+(?:your\s+vehicle|.+?)\s+on\s+([^\s]+)\s+at\s+([^\s.]+)/i);
                                if (reqMatch) {
                                    params.name = reqMatch[1];
                                    params.date = reqMatch[2];
                                    params.time = reqMatch[3];
                                }
                            }
                        }
                        break;

                    case "appointment":
                        if (rawTitle.includes('confirmed') || rawBody.includes('confirmed')) {
                            titleKey = "APPOINTMENT_CONFIRMED";
                            bodyKey = "APPOINTMENT_CONFIRMED_BODY";
                        } else if (rawTitle.includes('declined') || rawTitle.includes('rejected') || rawBody.includes('declined') || rawBody.includes('rejected')) {
                            titleKey = "APPOINTMENT_REJECTED";
                            bodyKey = "APPOINTMENT_REJECTED_BODY";
                        } else if (rawTitle.includes('rescheduled') || rawBody.includes('rescheduled')) {
                            titleKey = "APPOINTMENT_RESCHEDULED";
                            bodyKey = "APPOINTMENT_RESCHEDULED_BODY";
                        } else if (rawTitle.includes('submitted') || rawBody.includes('submitted')) {
                            titleKey = "VISIT_REQUEST_SUBMITTED";
                            bodyKey = "VISIT_REQUEST_SUBMITTED_BODY";
                        } else {
                            titleKey = "NEW_VISIT_REQUEST";
                            bodyKey = "NEW_VISIT_REQUEST_BODY";
                        }
                        break;

                    case "appointment_confirmed":
                        titleKey = "APPOINTMENT_CONFIRMED";
                        bodyKey = "APPOINTMENT_CONFIRMED_BODY";
                        break;

                    case "appointment_rejected":
                    case "appointment_declined":
                        titleKey = "APPOINTMENT_REJECTED";
                        bodyKey = "APPOINTMENT_REJECTED_BODY";
                        break;

                    case "appointment_rescheduled":
                        titleKey = "APPOINTMENT_RESCHEDULED";
                        bodyKey = "APPOINTMENT_RESCHEDULED_BODY";
                        break;

                    case "favorite_car_sold":
                    case "favorite_sold":
                        titleKey = "FAVORITE_CAR_SOLD";
                        bodyKey = "FAVORITE_CAR_SOLD_BODY";
                        {
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        }
                        break;

                    case "favorite_car_deleted":
                    case "favorite_deleted":
                        titleKey = "FAVORITE_CAR_DELETED";
                        bodyKey = "FAVORITE_CAR_DELETED_BODY";
                        {
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        }
                        break;

                    case "favorite_car_price_reduced":
                    case "price_reduced":
                    case "price_changes":
                        titleKey = "FAVORITE_CAR_PRICE_REDUCED";
                        bodyKey = "FAVORITE_CAR_PRICE_REDUCED_BODY";
                        {
                            const m = String(item.body || '').match(/price\s+of\s+(.+?)\s+was\s+reduced\s+from\s+([^\s]+)\s+to\s+([^\s.]+)/i);
                            if (m) {
                                params.car = m[1];
                                params.oldPrice = m[2];
                                params.newPrice = m[3];
                            }
                        }
                        break;

                    case "favorite_car_updated":
                    case "favorite_updated":
                        titleKey = "FAVORITE_CAR_UPDATED";
                        bodyKey = "FAVORITE_CAR_UPDATED_BODY";
                        {
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        }
                        break;

                    case "favorite_car_available_again":
                    case "available_again":
                        titleKey = "FAVORITE_CAR_AVAILABLE_AGAIN";
                        bodyKey = "FAVORITE_CAR_AVAILABLE_AGAIN_BODY";
                        {
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        }
                        break;

                    case "favorite_update":
                        if (rawTitle.includes('price drop') || rawBody.includes('reduced from')) {
                            titleKey = "FAVORITE_CAR_PRICE_REDUCED";
                            bodyKey = "FAVORITE_CAR_PRICE_REDUCED_BODY";
                            const m = String(item.body || '').match(/price\s+of\s+(.+?)\s+was\s+reduced\s+from\s+([^\s]+)\s+to\s+([^\s.]+)/i);
                            if (m) {
                                params.car = m[1];
                                params.oldPrice = m[2];
                                params.newPrice = m[3];
                            }
                        } else if (rawTitle.includes('sold') || rawBody.includes('marked as sold')) {
                            titleKey = "FAVORITE_CAR_SOLD";
                            bodyKey = "FAVORITE_CAR_SOLD_BODY";
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        } else if (rawTitle.includes('removed') || rawBody.includes('removed by the seller')) {
                            titleKey = "FAVORITE_CAR_DELETED";
                            bodyKey = "FAVORITE_CAR_DELETED_BODY";
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        } else {
                            titleKey = "FAVORITE_CAR_UPDATED";
                            bodyKey = "FAVORITE_CAR_UPDATED_BODY";
                            const m = String(item.body || '').match(/\((.+?)\)/);
                            if (m) params.car = m[1];
                        }
                        break;

                    case "new_matching_vehicle":
                        titleKey = "NEW_MATCHING_VEHICLE";
                        bodyKey = "NEW_MATCHING_VEHICLE_BODY";
                        break;

                    case "plan_expired":
                        titleKey = "PLAN_EXPIRED";
                        bodyKey = "PLAN_EXPIRED_BODY";
                        break;

                    case "plan_expiry_reminder":
                        titleKey = "PLAN_EXPIRY_REMINDER";
                        bodyKey = "PLAN_EXPIRY_REMINDER_BODY";
                        break;

                    case "support_resolved":
                    case "support":
                        titleKey = "SUPPORT_TICKET_RESOLVED";
                        bodyKey = "SUPPORT_TICKET_RESOLVED_BODY";
                        {
                            const tMatch = String(item.body || '').match(/ticket\s+#?(\d+)/i);
                            const rMatch = String(item.body || '').match(/resolved:\s*(.+)$/i);
                            params = {
                                ticketId: tMatch ? tMatch[1] : "",
                                response: rMatch ? rMatch[1] : ""
                            };
                        }
                        break;

                    default:
                        break;
                }

                // 2. Secondary pattern fallback matching on Title and Body
                if (!titleKey) {
                    if (rawTitle.includes('new car listed') || rawTitle.includes('neues fahrzeug') || rawTitle.includes('nouveau véhicule') || rawTitle.includes('nuovo veicolo')) {
                        titleKey = "NEW_CAR_LISTED";
                        bodyKey = "NEW_CAR_LISTED_BODY";
                    } else if (rawTitle.includes('favorited vehicle updated') || rawTitle.includes('gemerktes fahrzeug aktualisiert') || rawTitle.includes('véhicule favori mis à jour') || rawTitle.includes('véhicule sauvegardé mis à jour') || rawTitle.includes('veicolo salvato aggiornato')) {
                        titleKey = "FAVORITE_CAR_UPDATED";
                        bodyKey = "FAVORITE_CAR_UPDATED_BODY";
                        const m = String(item.body || '').match(/\((.+?)\)/);
                        if (m) params.car = m[1];
                    } else if (rawTitle.includes('price drop') || rawTitle.includes('preissenkung') || rawTitle.includes('baisse de prix') || rawTitle.includes('calo di prezzo') || rawBody.includes('reduced from')) {
                        titleKey = "FAVORITE_CAR_PRICE_REDUCED";
                        bodyKey = "FAVORITE_CAR_PRICE_REDUCED_BODY";
                        const m = String(item.body || '').match(/price\s+of\s+(.+?)\s+was\s+reduced\s+from\s+([^\s]+)\s+to\s+([^\s.]+)/i);
                        if (m) {
                            params.car = m[1];
                            params.oldPrice = m[2];
                            params.newPrice = m[3];
                        }
                    } else if (rawTitle.includes('favorited vehicle sold') || rawTitle.includes('gemerktes fahrzeug verkauft') || rawTitle.includes('véhicule favori vendu') || rawTitle.includes('veicolo salvato venduto')) {
                        titleKey = "FAVORITE_CAR_SOLD";
                        bodyKey = "FAVORITE_CAR_SOLD_BODY";
                        const m = String(item.body || '').match(/\((.+?)\)/);
                        if (m) params.car = m[1];
                    } else if (rawTitle.includes('favorited vehicle removed') || rawTitle.includes('gemerktes fahrzeug entfernt') || rawTitle.includes('véhicule favori supprimé') || rawTitle.includes('veicolo salvato rimosso')) {
                        titleKey = "FAVORITE_CAR_DELETED";
                        bodyKey = "FAVORITE_CAR_DELETED_BODY";
                        const m = String(item.body || '').match(/\((.+?)\)/);
                        if (m) params.car = m[1];
                    } else if (rawTitle.includes('vehicle available again') || rawTitle.includes('fahrzeug wieder verfügbar') || rawTitle.includes('véhicule à nouveau disponible') || rawTitle.includes('veicolo di nuovo disponibile')) {
                        titleKey = "FAVORITE_CAR_AVAILABLE_AGAIN";
                        bodyKey = "FAVORITE_CAR_AVAILABLE_AGAIN_BODY";
                    } else if (rawTitle.includes('appointment request submitted') || rawTitle.includes('besichtigungsanfrage eingereicht') || rawTitle.includes('demande de visite envoyée') || rawTitle.includes('demande de rendez-vous soumise') || rawTitle.includes('richiesta appuntamento inviata')) {
                        titleKey = "VISIT_REQUEST_SUBMITTED";
                        bodyKey = "VISIT_REQUEST_SUBMITTED_BODY";
                        const m = String(item.body || '').match(/appointment request for (.+?) has been submitted for (.+?) at (.+?)\.?$/i);
                        if (m) {
                            params.car = m[1];
                            params.date = m[2];
                            params.time = m[3];
                        }
                    } else if (rawTitle.includes('new appointment request') || rawTitle.includes('neue besichtigungsanfrage') || rawTitle.includes('nouvelle demande de rendez-vous') || rawTitle.includes('nuova richiesta di appuntamento')) {
                        titleKey = "NEW_VISIT_REQUEST";
                        bodyKey = "NEW_VISIT_REQUEST_BODY";
                    } else if (rawTitle.includes('appointment confirmed') || rawTitle.includes('besichtigungstermin bestätigt') || rawTitle.includes('rendez-vous confirmé') || rawTitle.includes('appuntamento confermato')) {
                        titleKey = "APPOINTMENT_CONFIRMED";
                        bodyKey = "APPOINTMENT_CONFIRMED_BODY";
                    } else if (rawTitle.includes('appointment declined') || rawTitle.includes('appointment rejected') || rawTitle.includes('besichtigungstermin abgelehnt') || rawTitle.includes('rendez-vous refusé') || rawTitle.includes('appuntamento rifiutato')) {
                        titleKey = "APPOINTMENT_REJECTED";
                        bodyKey = "APPOINTMENT_REJECTED_BODY";
                    } else if (rawTitle.includes('appointment rescheduled') || rawTitle.includes('besichtigungstermin verschoben') || rawTitle.includes('rendez-vous replanifié') || rawTitle.includes('appuntamento riprogrammato')) {
                        titleKey = "APPOINTMENT_RESCHEDULED";
                        bodyKey = "APPOINTMENT_RESCHEDULED_BODY";
                    } else if (rawTitle.includes('slot request approved') || rawTitle.includes('slot-anfrage genehmigt') || rawTitle.includes("demande d'emplacements approuvée")) {
                        titleKey = "SLOT_REQUEST_APPROVED";
                        bodyKey = "SLOT_REQUEST_APPROVED_BODY";
                        const slotMatch = String(item.body || '').match(/(\d+)\s+slots?/i);
                        const priceMatch = String(item.body || '').match(/price\s+of\s+([^\s.]+(?:\.\d+)?(?:.-CHF|-CHF|\s*CHF)?)/i);
                        params = {
                            slots: slotMatch ? slotMatch[1] : "",
                            price: priceMatch ? priceMatch[1] : ""
                        };
                    } else if (rawTitle.includes('slot request rejected') || rawTitle.includes('slot-anfrage abgelehnt') || rawTitle.includes("demande d'emplacements refusée")) {
                        titleKey = "SLOT_REQUEST_REJECTED";
                        bodyKey = "SLOT_REQUEST_REJECTED_BODY";
                    } else if (rawTitle.includes('listing published') || rawTitle.includes('inserat') || rawTitle.includes('annonce publiée') || rawTitle.includes('published successfully')) {
                        titleKey = "LISTING_PUBLISHED";
                        bodyKey = "LISTING_PUBLISHED_BODY";
                        const carMatch = String(item.body || '').match(/listing for (.+?) is now live/i);
                        params = { car: carMatch ? carMatch[1] : "Car" };
                    } else if (rawTitle.includes('plan expired') || rawTitle.includes('plan abgelaufen') || rawTitle.includes('abonnement expiré')) {
                        titleKey = "PLAN_EXPIRED";
                        bodyKey = "PLAN_EXPIRED_BODY";
                    } else if (rawTitle.includes('plan expiry reminder') || rawTitle.includes('erinnerung') || rawTitle.includes('rappel : expiration')) {
                        titleKey = "PLAN_EXPIRY_REMINDER";
                        bodyKey = "PLAN_EXPIRY_REMINDER_BODY";
                    } else if (rawTitle.includes('seller approved') || rawTitle.includes('verkäufer bestätigt') || rawTitle.includes('vendeur approuvé')) {
                        titleKey = "SELLER_APPROVED";
                        bodyKey = "SELLER_APPROVED_BODY";
                    } else if (rawTitle.includes('seller application declined') || rawTitle.includes('candidature vendeur refusée') || rawTitle.includes('verkäuferantrag abgelehnt')) {
                        titleKey = "SELLER_REJECTED";
                        bodyKey = "SELLER_REJECTED_BODY";
                    } else if (rawTitle.includes('purchase agreement rejected') || rawTitle.includes('kaufvertrag abgelehnt') || rawTitle.includes("contrat d'achat refusé")) {
                        titleKey = "PURCHASE_AGREEMENT_REJECTED";
                        bodyKey = "PURCHASE_AGREEMENT_REJECTED_BODY";
                    } else if (rawTitle.includes('purchase agreement') || rawTitle.includes('kaufvertrag') || rawTitle.includes("contrat d'achat")) {
                        titleKey = "NEW_PURCHASE_AGREEMENT";
                        bodyKey = "NEW_PURCHASE_AGREEMENT_BODY";
                    } else if (rawTitle.includes('matching vehicle') || rawTitle.includes('passendes fahrzeug') || rawTitle.includes('véhicule correspondant')) {
                        titleKey = "NEW_MATCHING_VEHICLE";
                        bodyKey = "NEW_MATCHING_VEHICLE_BODY";
                    }
                }

                // Translate using dictionary
                if (titleKey && bodyKey) {
                    const translated = getNotificationTranslation(
                        userLanguage,
                        titleKey,
                        bodyKey,
                        params
                    );
                    title = translated.title;
                    body = translated.body;
                }

                return {
                    ...item,
                    title: stripHtml(title),
                    body: stripHtml(body)
                };
            })
        );

        // Sort descending by created date / ID
        translatedNotifications.sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return (b.id || 0) - (a.id || 0);
        });

        const formattedNotifications = translatedNotifications.map((item) => {
            const mCreated = item.createdAt ? moment(item.createdAt) : null;
            const mUpdated = item.updatedAt ? moment(item.updatedAt) : null;
            const formattedDate = mCreated ? mCreated.format('DD.MM.YYYY') : null;
            const formattedTime = mCreated ? mCreated.format('HH:mm') : null;
            const formattedDateTime = mCreated ? mCreated.format('DD.MM.YYYY HH:mm') : null;
            const isReadNormalized = Number(item.isRead) === 1 ? 1 : 0;
            return {
                ...item,
                isRead: isReadNormalized,
                createdAt: formattedDateTime || formattedDate,
                updatedAt: mUpdated ? mUpdated.format('DD.MM.YYYY HH:mm') : null,
                date: formattedDate,
                time: formattedTime,
                timeAgo: mCreated ? mCreated.fromNow() : null,
                createdAtRaw: item.createdAt
            };
        });

        const unreadCount = formattedNotifications.filter(item => item.isRead === 0).length;

        const data = {
            allNotification: formattedNotifications,
            unReadNotifications: unreadCount,
            unreadCount: unreadCount,
            unReadCount: unreadCount,
            unread_count: unreadCount,
            hasUnread: unreadCount > 0,
            has_unread: unreadCount > 0,
            is_unread: unreadCount > 0
        };

        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'notificationListFoundSuccessfully'),
            data,
            userLanguage
        );

    } catch (error) {
        console.error("fetchNotificationByBuyersIds error:", error);
        const userLanguage = getRequestLanguage(req);
        return handleError(
            res,
            500,
            getMessage(userLanguage, variableTypes.INTERNAL_SERVER_ERROR),
            userLanguage
        );
    }
};
