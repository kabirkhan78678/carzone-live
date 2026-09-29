/**
 * Localized translation dictionary for all CarZone push and in-app notifications
 * Supports en (English), de (German), fr (French), it (Italian)
 */

export const notificationTranslations = {
    en: {
        NEW_CHAT_MESSAGE: ({ senderName }) =>
            senderName || "New Message",
        NEW_CHAT_MESSAGE_BODY: ({ message, senderName }) =>
            message || `${senderName || "Someone"} sent you a message.`,

        NEW_CAR_INQUIRY: "New Vehicle Inquiry",
        NEW_CAR_INQUIRY_BODY: ({ name, car }) =>
            `${name || "A buyer"} has sent an inquiry for your ${car || "vehicle"}.`,

        NEW_VISIT_REQUEST: "New Appointment Request",
        NEW_VISIT_REQUEST_BODY: ({ name, date, time, car }) =>
            `${name || "A buyer"} has requested an appointment for ${car || "your vehicle"} on ${date} at ${time}.`,

        VISIT_REQUEST_SUBMITTED: "Appointment Request Submitted",
        VISIT_REQUEST_SUBMITTED_BODY: ({ car, date, time }) =>
            `Your appointment request for ${car || "the vehicle"} has been submitted for ${date} at ${time}.`,

        APPOINTMENT_CONFIRMED: "Appointment Confirmed",
        APPOINTMENT_CONFIRMED_BODY: ({ car, date, time, sellerName }) =>
            `Your appointment for ${car || "the vehicle"} on ${date} at ${time} has been confirmed by ${sellerName || "the seller"}.`,

        APPOINTMENT_REJECTED: "Appointment Declined",
        APPOINTMENT_REJECTED_BODY: ({ car }) =>
            `Your appointment request for ${car || "the vehicle"} could not be accepted.`,

        APPOINTMENT_RESCHEDULED: "Appointment Rescheduled",
        APPOINTMENT_RESCHEDULED_BODY: ({ car, date, time }) =>
            `Your appointment for ${car || "the vehicle"} has been rescheduled to ${date} at ${time}.`,

        APPOINTMENT_REMINDER_24H: "Appointment Reminder (Tomorrow)",
        APPOINTMENT_REMINDER_24H_BODY: ({ car, time }) =>
            `Reminder: You have an appointment scheduled for ${car || "the vehicle"} tomorrow at ${time}.`,

        APPOINTMENT_REMINDER_TODAY: "Appointment Reminder (Today)",
        APPOINTMENT_REMINDER_TODAY_BODY: ({ car, time }) =>
            `Reminder: Your appointment for ${car || "the vehicle"} is scheduled for today at ${time}.`,

        FAVORITE_CAR_SOLD: "Favorited Vehicle Sold",
        FAVORITE_CAR_SOLD_BODY: ({ car }) =>
            `A vehicle in your favorites (${car || "saved car"}) has been marked as sold.`,

        FAVORITE_CAR_DELETED: "Favorited Vehicle Removed",
        FAVORITE_CAR_DELETED_BODY: ({ car }) =>
            `A vehicle in your favorites (${car || "saved car"}) was removed by the seller.`,

        FAVORITE_CAR_PRICE_REDUCED: "Price Drop on Saved Vehicle!",
        FAVORITE_CAR_PRICE_REDUCED_BODY: ({ car, oldPrice, newPrice }) =>
            `Great news! The price of ${car || "a saved car"} was reduced from ${oldPrice} to ${newPrice}.`,

        FAVORITE_CAR_UPDATED: "Favorited Vehicle Updated",
        FAVORITE_CAR_UPDATED_BODY: ({ car }) =>
            `Important details for your saved vehicle (${car || "saved car"}) have been updated.`,

        FAVORITE_CAR_AVAILABLE_AGAIN: "Vehicle Available Again!",
        FAVORITE_CAR_AVAILABLE_AGAIN_BODY: ({ car }) =>
            `Good news! ${car || "A saved car"} that was previously marked as sold is available again.`,

        NEW_MATCHING_VEHICLE: "New Matching Vehicle Found",
        NEW_MATCHING_VEHICLE_BODY: ({ car, searchName }) =>
            `A new vehicle matching your saved search "${searchName || "saved criteria"}" is now live: ${car || "View car"}.`,

        LISTING_PUBLISHED: "Listing Published Successfully",
        LISTING_PUBLISHED_BODY: ({ car }) =>
            `Congratulations! Your listing for ${car || "your vehicle"} is now live on CarZone.`,

        INCOMPLETE_LISTING_REMINDER: "Complete Your Vehicle Listing",
        INCOMPLETE_LISTING_REMINDER_BODY: ({ car }) =>
            `You have an unfinished listing for ${car || "your vehicle"}. Finish it now to connect with buyers!`,

        LISTING_EXPIRING_SOON: "Listing Expiring Soon",
        LISTING_EXPIRING_SOON_BODY: ({ car, days }) =>
            `Your listing for ${car || "your vehicle"} will expire in ${days} day(s). Renew now to stay active.`,

        LISTING_EXPIRED: "Listing Expired",
        LISTING_EXPIRED_BODY: ({ car }) =>
            `Your listing for ${car || "your vehicle"} has expired. Renew your plan to reactivate it.`,

        LISTING_REJECTED: "Listing Not Approved",
        LISTING_REJECTED_BODY: ({ car, reason }) =>
            `Your listing for ${car || "your vehicle"} was rejected: ${reason || "Does not comply with listing guidelines."}`,

        LISTING_EXTENDED: "Listing Successfully Extended",
        LISTING_EXTENDED_BODY: ({ car }) =>
            `Your listing for ${car || "your vehicle"} has been successfully extended.`,

        ACCOUNT_SECURITY_ALERT: "Account Security Alert",
        ACCOUNT_SECURITY_ALERT_BODY: ({ activity }) =>
            `Security Alert: ${activity || "Your password was recently changed."} If this wasn't you, contact support immediately.`,

        SYSTEM_ANNOUNCEMENT: ({ title }) => title || "System Announcement",
        SYSTEM_ANNOUNCEMENT_BODY: ({ body }) => body || "CarZone platform announcement.",

        SELLER_MONTHLY_CHECKIN: "Vehicle Availability Check",
        SELLER_MONTHLY_CHECKIN_BODY: ({ car }) =>
            `Is this vehicle (${car || "your car"}) still available or has it already been sold?`,

        NEW_CAR_LISTED: "New Car Listed",
        NEW_CAR_LISTED_BODY: "A new car has been listed on CarZone.",

        PLAN_EXPIRED: "🚫 Plan Expired",
        PLAN_EXPIRED_BODY: "Your subscription plan has expired.",

        PLAN_EXPIRY_REMINDER: "⏰ Plan Expiry Reminder",
        PLAN_EXPIRY_REMINDER_BODY: ({ days }) =>
            days ? `Your subscription plan will expire in ${days} day(s).` : "Your subscription plan will expire in 3 days.",

        NEW_PURCHASE_AGREEMENT: "New Purchase Agreement",
        NEW_PURCHASE_AGREEMENT_BODY: ({ name, car, offeredPrice }) =>
            `${name} has submitted a purchase agreement for your ${car} car. Offered price: ${offeredPrice}.`,

        PURCHASE_AGREEMENT_REJECTED: "Purchase Agreement Rejected",
        PURCHASE_AGREEMENT_REJECTED_BODY: ({ name, car }) =>
            `${name} has rejected the purchase agreement for your ${car} car.`,

        SLOT_REQUEST_APPROVED: "Slot Request Approved!",
        SLOT_REQUEST_APPROVED_BODY: ({ slots, price }) =>
            slots && price
                ? `Your request for ${slots} slots has been approved at a price of ${price}. Tap to view your new custom plan!`
                : "Your slot request has been approved! Tap to view your new custom plan.",

        SLOT_REQUEST_REJECTED: "Slot Request Rejected",
        SLOT_REQUEST_REJECTED_BODY: "Your slot request has been rejected. Please choose another available slot.",

        SELLER_APPROVED: ({ fullName }) => `${fullName || "Seller"} Approved`,
        SELLER_APPROVED_BODY: ({ fullName }) => `Congratulations${fullName ? ', ' + fullName : ''}! Your account has been approved as a seller.`,

        SELLER_REJECTED: "Seller Application Declined",
        SELLER_REJECTED_BODY: ({ fullName }) => `Sorry${fullName ? ', ' + fullName : ''}, your application to become a seller was not approved.`,
    },

    de: {
        NEW_CHAT_MESSAGE: ({ senderName }) =>
            senderName || "Neue Nachricht",
        NEW_CHAT_MESSAGE_BODY: ({ message, senderName }) =>
            message || `${senderName || "Jemand"} hat Ihnen eine Nachricht gesendet.`,

        NEW_CAR_INQUIRY: "Neue Fahrzeuganfrage",
        NEW_CAR_INQUIRY_BODY: ({ name, car }) =>
            `${name || "Ein Interessent"} hat eine Anfrage für Ihren ${car || "Fahrzeug"} gesendet.`,

        NEW_VISIT_REQUEST: "Neue Besichtigungsanfrage",
        NEW_VISIT_REQUEST_BODY: ({ name, date, time, car }) =>
            `${name || "Ein Interessent"} hat eine Besichtigung für ${car || "Ihr Fahrzeug"} am ${date} um ${time} angefragt.`,

        VISIT_REQUEST_SUBMITTED: "Besichtigungsanfrage eingereicht",
        VISIT_REQUEST_SUBMITTED_BODY: ({ car, date, time }) =>
            `Ihre Besichtigungsanfrage für ${car || "das Fahrzeug"} wurde für den ${date} um ${time} eingereicht.`,

        APPOINTMENT_CONFIRMED: "Besichtigungstermin bestätigt",
        APPOINTMENT_CONFIRMED_BODY: ({ car, date, time, sellerName }) =>
            `Ihr Termin für ${car || "das Fahrzeug"} am ${date} um ${time} wurde von ${sellerName || "dem Verkäufer"} bestätigt.`,

        APPOINTMENT_REJECTED: "Besichtigungstermin abgelehnt",
        APPOINTMENT_REJECTED_BODY: ({ car }) =>
            `Ihre Terminanfrage für ${car || "das Fahrzeug"} konnte leider nicht angenommen werden.`,

        APPOINTMENT_RESCHEDULED: "Besichtigungstermin verschoben",
        APPOINTMENT_RESCHEDULED_BODY: ({ car, date, time }) =>
            `Ihr Termin für ${car || "das Fahrzeug"} wurde auf den ${date} um ${time} verschoben.`,

        APPOINTMENT_REMINDER_24H: "Terminerinnerung (Morgen)",
        APPOINTMENT_REMINDER_24H_BODY: ({ car, time }) =>
            `Erinnerung: Sie haben morgen um ${time} einen Besichtigungstermin für ${car || "das Fahrzeug"}.`,

        APPOINTMENT_REMINDER_TODAY: "Terminerinnerung (Heute)",
        APPOINTMENT_REMINDER_TODAY_BODY: ({ car, time }) =>
            `Erinnerung: Ihr Besichtigungstermin für ${car || "das Fahrzeug"} findet heute um ${time} statt.`,

        FAVORITE_CAR_SOLD: "Gemerktes Fahrzeug verkauft",
        FAVORITE_CAR_SOLD_BODY: ({ car }) =>
            `Ein Fahrzeug auf Ihrem Merkzettel (${car || "Fahrzeug"}) wurde als verkauft markiert.`,

        FAVORITE_CAR_DELETED: "Gemerktes Fahrzeug gelöscht",
        FAVORITE_CAR_DELETED_BODY: ({ car }) =>
            `Ein Fahrzeug auf Ihrem Merkzettel (${car || "Fahrzeug"}) wurde vom Verkäufer entfernt.`,

        FAVORITE_CAR_PRICE_REDUCED: "Preissenkung bei gemerktem Fahrzeug!",
        FAVORITE_CAR_PRICE_REDUCED_BODY: ({ car, oldPrice, newPrice }) =>
            `Tolle Neuigkeiten! Der Preis für ${car || "ein gemerktes Fahrzeug"} wurde von ${oldPrice} auf ${newPrice} gesenkt.`,

        FAVORITE_CAR_UPDATED: "Gemerktes Fahrzeug aktualisiert",
        FAVORITE_CAR_UPDATED_BODY: ({ car }) =>
            `Wichtige Informationen zu Ihrem gemerkten Fahrzeug (${car || "Fahrzeug"}) wurden aktualisiert.`,

        FAVORITE_CAR_AVAILABLE_AGAIN: "Fahrzeug wieder verfügbar!",
        FAVORITE_CAR_AVAILABLE_AGAIN_BODY: ({ car }) =>
            `Gute Nachrichten! ${car || "Ein gemerktes Fahrzeug"}, das als verkauft galt, ist wieder verfügbar.`,

        NEW_MATCHING_VEHICLE: "Neues passendes Fahrzeug gefunden",
        NEW_MATCHING_VEHICLE_BODY: ({ car, searchName }) =>
            `Ein neues Inserat passend zu Ihrer Suche "${searchName || "gespeicherte Suche"}" ist verfügbar: ${car || "Fahrzeug ansehen"}.`,

        LISTING_PUBLISHED: "Inserat erfolgreich veröffentlicht",
        LISTING_PUBLISHED_BODY: ({ car }) =>
            `Herzlichen Glückwunsch! Ihr Inserat für ${car || "Ihr Fahrzeug"} ist jetzt online auf CarZone.`,

        INCOMPLETE_LISTING_REMINDER: "Vervollständigen Sie Ihr Inserat",
        INCOMPLETE_LISTING_REMINDER_BODY: ({ car }) =>
            `Sie haben einen Inserats-Entwurf für ${car || "Ihr Fahrzeug"}. Schließen Sie ihn ab, um Käufer zu erreichen!`,

        LISTING_EXPIRING_SOON: "Inserat läuft bald ab",
        LISTING_EXPIRING_SOON_BODY: ({ car, days }) =>
            `Ihr Inserat für ${car || "Ihr Fahrzeug"} läuft in ${days} Tag(en) ab. Jetzt verlängern, um sichtbar zu bleiben.`,

        LISTING_EXPIRED: "Inserat abgelaufen",
        LISTING_EXPIRED_BODY: ({ car }) =>
            `Ihr Inserat für ${car || "Ihr Fahrzeug"} ist abgelaufen. Reaktivieren Sie es mit einer Planverlängerung.`,

        LISTING_REJECTED: "Inserat abgelehnt",
        LISTING_REJECTED_BODY: ({ car, reason }) =>
            `Ihr Inserat für ${car || "Ihr Fahrzeug"} wurde abgelehnt: ${reason || "Entspricht nicht den Richtlinien."}`,

        LISTING_EXTENDED: "Inserat erfolgreich verlängert",
        LISTING_EXTENDED_BODY: ({ car }) =>
            `Ihr Inserat für ${car || "Ihr Fahrzeug"} wurde erfolgreich verlängert.`,

        ACCOUNT_SECURITY_ALERT: "Sicherheitswarnung zum Konto",
        ACCOUNT_SECURITY_ALERT_BODY: ({ activity }) =>
            `Sicherheitswarnung: ${activity || "Ihr Passwort wurde kürzlich geändert."} Falls Sie das nicht waren, kontaktieren Sie uns bitte sofort.`,

        SYSTEM_ANNOUNCEMENT: ({ title }) => title || "Systemankündigung",
        SYSTEM_ANNOUNCEMENT_BODY: ({ body }) => body || "CarZone Plattform-Mitteilung.",

        SELLER_MONTHLY_CHECKIN: "Fahrzeug-Verfügbarkeitsprüfung",
        SELLER_MONTHLY_CHECKIN_BODY: ({ car }) =>
            `Ist dieses Fahrzeug (${car || "Ihr Fahrzeug"}) noch verfügbar oder wurde es bereits verkauft?`,

        NEW_CAR_LISTED: "Neues Fahrzeug inseriert",
        NEW_CAR_LISTED_BODY: "Ein neues Fahrzeug wurde auf CarZone inseriert.",

        PLAN_EXPIRED: "🚫 Plan abgelaufen",
        PLAN_EXPIRED_BODY: "Ihr Abonnement ist abgelaufen.",

        PLAN_EXPIRY_REMINDER: "⏰ Erinnerung: Plan läuft bald ab",
        PLAN_EXPIRY_REMINDER_BODY: ({ days }) =>
            days ? `Ihr Abonnement läuft in ${days} Tag(en) ab.` : "Ihr Abonnement läuft in 3 Tagen ab.",

        NEW_PURCHASE_AGREEMENT: "Neuer Kaufvertrag",
        NEW_PURCHASE_AGREEMENT_BODY: ({ name, car, offeredPrice }) =>
            `${name} hat einen Kaufvertrag für Ihr Fahrzeug ${car} eingereicht. Angebotspreis: ${offeredPrice}.`,

        PURCHASE_AGREEMENT_REJECTED: "Kaufvertrag abgelehnt",
        PURCHASE_AGREEMENT_REJECTED_BODY: ({ name, car }) =>
            `${name} hat den Kaufvertrag für Ihr Fahrzeug ${car} abgelehnt.`,

        SLOT_REQUEST_APPROVED: "Slot-Anfrage genehmigt!",
        SLOT_REQUEST_APPROVED_BODY: ({ slots, price }) =>
            slots && price
                ? `Ihre Anfrage für ${slots} Slots zum Preis von ${price} wurde genehmigt. Tippen Sie hier, um Ihren neuen individuellen Plan anzuzeigen!`
                : "Ihre Slot-Anfrage wurde genehmigt! Tippen Sie hier, um Ihren neuen Plan anzuzeigen.",

        SLOT_REQUEST_REJECTED: "Slot-Anfrage abgelehnt",
        SLOT_REQUEST_REJECTED_BODY: "Ihre Slot-Anfrage wurde abgelehnt. Bitte wählen Sie einen anderen verfügbaren Slot.",

        SELLER_APPROVED: ({ fullName }) => `${fullName || "Verkäufer"} Genehmigt`,
        SELLER_APPROVED_BODY: ({ fullName }) => `Herzlichen Glückwunsch${fullName ? ', ' + fullName : ''}! Ihr Konto wurde als Verkäufer genehmigt.`,

        SELLER_REJECTED: "Verkäuferantrag abgelehnt",
        SELLER_REJECTED_BODY: ({ fullName }) => `Entschuldigung${fullName ? ', ' + fullName : ''}, Ihr Antrag als Verkäufer wurde leider nicht genehmigt.`,
    },

    fr: {
        NEW_CHAT_MESSAGE: ({ senderName }) =>
            senderName || "Nouveau message",
        NEW_CHAT_MESSAGE_BODY: ({ message, senderName }) =>
            message || `${senderName || "Quelqu'un"} vous a envoyé un message.`,

        NEW_CAR_INQUIRY: "Nouvelle demande de véhicule",
        NEW_CAR_INQUIRY_BODY: ({ name, car }) =>
            `${name || "Un acheteur"} a envoyé une demande concernant votre ${car || "véhicule"}.`,

        NEW_VISIT_REQUEST: "Nouvelle demande de rendez-vous",
        NEW_VISIT_REQUEST_BODY: ({ name, date, time, car }) =>
            `${name || "Un acheteur"} a demandé une visite pour ${car || "votre véhicule"} le ${date} à ${time}.`,

        VISIT_REQUEST_SUBMITTED: "Demande de visite envoyée",
        VISIT_REQUEST_SUBMITTED_BODY: ({ car, date, time }) =>
            `Votre demande de visite pour ${car || "le véhicule"} a été envoyée pour le ${date} à ${time}.`,

        APPOINTMENT_CONFIRMED: "Rendez-vous confirmé",
        APPOINTMENT_CONFIRMED_BODY: ({ car, date, time, sellerName }) =>
            `Votre rendez-vous pour ${car || "le véhicule"} le ${date} à ${time} a été confirmé par ${sellerName || "le vendeur"}.`,

        APPOINTMENT_REJECTED: "Rendez-vous refusé",
        APPOINTMENT_REJECTED_BODY: ({ car }) =>
            `Votre demande de rendez-vous pour ${car || "le véhicule"} n'a pas pu être acceptée.`,

        APPOINTMENT_RESCHEDULED: "Rendez-vous replanifié",
        APPOINTMENT_RESCHEDULED_BODY: ({ car, date, time }) =>
            `Votre rendez-vous pour ${car || "le véhicule"} a été reporté au ${date} à ${time}.`,

        APPOINTMENT_REMINDER_24H: "Rappel de rendez-vous (Demain)",
        APPOINTMENT_REMINDER_24H_BODY: ({ car, time }) =>
            `Rappel : Vous avez un rendez-vous pour ${car || "le véhicule"} demain à ${time}.`,

        APPOINTMENT_REMINDER_TODAY: "Rappel de rendez-vous (Aujourd'hui)",
        APPOINTMENT_REMINDER_TODAY_BODY: ({ car, time }) =>
            `Rappel : Votre rendez-vous pour ${car || "le véhicule"} est prévu aujourd'hui à ${time}.`,

        FAVORITE_CAR_SOLD: "Véhicule favori vendu",
        FAVORITE_CAR_SOLD_BODY: ({ car }) =>
            `Un véhicule de vos favoris (${car || "véhicule"}) a été marqué comme vendu.`,

        FAVORITE_CAR_DELETED: "Véhicule favori supprimé",
        FAVORITE_CAR_DELETED_BODY: ({ car }) =>
            `Un véhicule de vos favoris (${car || "véhicule"}) a été supprimé par le vendeur.`,

        FAVORITE_CAR_PRICE_REDUCED: "Baisse de prix sur un véhicule favori !",
        FAVORITE_CAR_PRICE_REDUCED_BODY: ({ car, oldPrice, newPrice }) =>
            `Bonne nouvelle ! Le prix de ${car || "votre favori"} est passé de ${oldPrice} à ${newPrice}.`,

        FAVORITE_CAR_UPDATED: "Véhicule favori mis à jour",
        FAVORITE_CAR_UPDATED_BODY: ({ car }) =>
            `Des informations importantes concernant votre véhicule favori (${car || "véhicule"}) ont été mises à jour.`,

        FAVORITE_CAR_AVAILABLE_AGAIN: "Véhicule à nouveau disponible !",
        FAVORITE_CAR_AVAILABLE_AGAIN_BODY: ({ car }) =>
            `Bonne nouvelle ! ${car || "Un véhicule favori"} précédemment marqué comme vendu est de nouveau disponible.`,

        NEW_MATCHING_VEHICLE: "Nouveau véhicule correspondant trouvé",
        NEW_MATCHING_VEHICLE_BODY: ({ car, searchName }) =>
            `Une nouvelle annonce correspondant à votre recherche "${searchName || "recherche sauvegardée"}" est disponible : ${car || "Voir véhicule"}.`,

        LISTING_PUBLISHED: "Annonce publiée avec succès",
        LISTING_PUBLISHED_BODY: ({ car }) =>
            `Félicitations ! Votre annonce pour ${car || "votre véhicule"} est désormais en ligne sur CarZone.`,

        INCOMPLETE_LISTING_REMINDER: "Finalisez votre annonce",
        INCOMPLETE_LISTING_REMINDER_BODY: ({ car }) =>
            `Vous avez un brouillon d'annonce pour ${car || "votre véhicule"}. Complétez-le pour toucher des acheteurs !`,

        LISTING_EXPIRING_SOON: "Annonce expire bientôt",
        LISTING_EXPIRING_SOON_BODY: ({ car, days }) =>
            `Votre annonce pour ${car || "votre véhicule"} expire dans ${days} jour(s). Renouvelez-la pour rester visible.`,

        LISTING_EXPIRED: "Annonce expirée",
        LISTING_EXPIRED_BODY: ({ car }) =>
            `Votre annonce pour ${car || "votre véhicule"} a expiré. Renouvelez votre forfait pour la réactiver.`,

        LISTING_REJECTED: "Annonce rejetée",
        LISTING_REJECTED_BODY: ({ car, reason }) =>
            `Votre annonce pour ${car || "votre véhicule"} a été refusée : ${reason || "Ne respecte pas les critères d'annonce."}`,

        LISTING_EXTENDED: "Annonce prolongée avec succès",
        LISTING_EXTENDED_BODY: ({ car }) =>
            `Votre annonce pour ${car || "votre véhicule"} a été prolongée avec succès.`,

        ACCOUNT_SECURITY_ALERT: "Alerte de sécurité du compte",
        ACCOUNT_SECURITY_ALERT_BODY: ({ activity }) =>
            `Sécurité : ${activity || "Votre mot de passe a été modifié."} Si vous n'êtes pas à l'origine de cette action, contactez le support.`,

        SYSTEM_ANNOUNCEMENT: ({ title }) => title || "Annonce système",
        SYSTEM_ANNOUNCEMENT_BODY: ({ body }) => body || "Mise à jour de la plateforme CarZone.",

        SELLER_MONTHLY_CHECKIN: "Vérification de disponibilité",
        SELLER_MONTHLY_CHECKIN_BODY: ({ car }) =>
            `Ce véhicule (${car || "votre véhicule"}) est-il toujours disponible ou a-t-il déjà été vendu ?`,

        NEW_CAR_LISTED: "Nouveau véhicule ajouté",
        NEW_CAR_LISTED_BODY: "Un nouveau véhicule a été ajouté sur CarZone.",

        PLAN_EXPIRED: "🚫 Abonnement expiré",
        PLAN_EXPIRED_BODY: "Votre abonnement a expiré.",

        PLAN_EXPIRY_REMINDER: "⏰ Rappel : Expiration de l'abonnement",
        PLAN_EXPIRY_REMINDER_BODY: ({ days }) =>
            days ? `Votre abonnement expirera dans ${days} jour(s).` : "Votre abonnement expirera dans 3 jours.",

        NEW_PURCHASE_AGREEMENT: "Nouveau contrat d'achat",
        NEW_PURCHASE_AGREEMENT_BODY: ({ name, car, offeredPrice }) =>
            `${name} a soumis un contrat d'achat pour votre véhicule ${car}. Prix proposé : ${offeredPrice}.`,

        PURCHASE_AGREEMENT_REJECTED: "Contrat d'achat refusé",
        PURCHASE_AGREEMENT_REJECTED_BODY: ({ name, car }) =>
            `${name} a refusé le contrat d'achat pour votre véhicule ${car}.`,

        SLOT_REQUEST_APPROVED: "Demande d'emplacements approuvée !",
        SLOT_REQUEST_APPROVED_BODY: ({ slots, price }) =>
            slots && price
                ? `Votre demande de ${slots} emplacements au prix de ${price} a été approuvée. Appuyez pour voir votre nouveau plan personnalisé !`
                : "Votre demande d'emplacements a été approuvée ! Appuyez pour voir votre nouveau plan.",

        SLOT_REQUEST_REJECTED: "Demande d'emplacements refusée",
        SLOT_REQUEST_REJECTED_BODY: "Votre demande d'emplacements a été refusée. Veuillez choisir un autre emplacement disponible.",

        SELLER_APPROVED: ({ fullName }) => `${fullName || "Vendeur"} Approuvé`,
        SELLER_APPROVED_BODY: ({ fullName }) => `Félicitations${fullName ? ', ' + fullName : ''} ! Votre compte vendeur a été approuvé.`,

        SELLER_REJECTED: "Candidature vendeur refusée",
        SELLER_REJECTED_BODY: ({ fullName }) => `Désolé${fullName ? ', ' + fullName : ''}, votre candidature vendeur n'a pas été approuvée.`,
    },

    it: {
        NEW_CHAT_MESSAGE: ({ senderName }) =>
            senderName || "Nuovo messaggio",
        NEW_CHAT_MESSAGE_BODY: ({ message, senderName }) =>
            message || `${senderName || "Qualcuno"} ti ha inviato un messaggio.`,

        NEW_CAR_INQUIRY: "Nuova richiesta veicolo",
        NEW_CAR_INQUIRY_BODY: ({ name, car }) =>
            `${name || "Un acquirente"} ha inviato una richiesta per la tua ${car || "veicolo"}.`,

        NEW_VISIT_REQUEST: "Nuova richiesta di appuntamento",
        NEW_VISIT_REQUEST_BODY: ({ name, date, time, car }) =>
            `${name || "Un acquirente"} ha richiesto una visita per ${car || "il tuo veicolo"} il ${date} alle ${time}.`,

        VISIT_REQUEST_SUBMITTED: "Richiesta appuntamento inviata",
        VISIT_REQUEST_SUBMITTED_BODY: ({ car, date, time }) =>
            `La tua richiesta di appuntamento per ${car || "il veicolo"} è stata inviata per il ${date} alle ${time}.`,

        APPOINTMENT_CONFIRMED: "Appuntamento confermato",
        APPOINTMENT_CONFIRMED_BODY: ({ car, date, time, sellerName }) =>
            `Il tuo appuntamento per ${car || "il veicolo"} il ${date} alle ${time} è stato confermato da ${sellerName || "il venditore"}.`,

        APPOINTMENT_REJECTED: "Appuntamento rifiutato",
        APPOINTMENT_REJECTED_BODY: ({ car }) =>
            `La tua richiesta di appuntamento per ${car || "il veicolo"} non è stata accettata.`,

        APPOINTMENT_RESCHEDULED: "Appuntamento riprogrammato",
        APPOINTMENT_RESCHEDULED_BODY: ({ car, date, time }) =>
            `Il tuo appuntamento per ${car || "il veicolo"} è stato spostato al ${date} alle ${time}.`,

        APPOINTMENT_REMINDER_24H: "Promemoria appuntamento (Domani)",
        APPOINTMENT_REMINDER_24H_BODY: ({ car, time }) =>
            `Promemoria: Hai un appuntamento programmato per ${car || "il veicolo"} domani alle ${time}.`,

        APPOINTMENT_REMINDER_TODAY: "Promemoria appuntamento (Oggi)",
        APPOINTMENT_REMINDER_TODAY_BODY: ({ car, time }) =>
            `Promemoria: Il tuo appuntamento per ${car || "il veicolo"} è fissato per oggi alle ${time}.`,

        FAVORITE_CAR_SOLD: "Veicolo salvato venduto",
        FAVORITE_CAR_SOLD_BODY: ({ car }) =>
            `Un veicolo nei tuoi preferiti (${car || "veicolo"}) è stato contrassegnato come venduto.`,

        FAVORITE_CAR_DELETED: "Veicolo salvato rimosso",
        FAVORITE_CAR_DELETED_BODY: ({ car }) =>
            `Un veicolo nei tuoi preferiti (${car || "veicolo"}) è stato rimosso dal venditore.`,

        FAVORITE_CAR_PRICE_REDUCED: "Calo di prezzo su un veicolo salvato!",
        FAVORITE_CAR_PRICE_REDUCED_BODY: ({ car, oldPrice, newPrice }) =>
            `Ottima notizia! Il prezzo di ${car || "un veicolo salvato"} è sceso da ${oldPrice} a ${newPrice}.`,

        FAVORITE_CAR_UPDATED: "Veicolo salvato aggiornato",
        FAVORITE_CAR_UPDATED_BODY: ({ car }) =>
            `Informazioni importanti per il tuo veicolo salvato (${car || "veicolo"}) sono state aggiornate.`,

        FAVORITE_CAR_AVAILABLE_AGAIN: "Veicolo nuovamente disponibile!",
        FAVORITE_CAR_AVAILABLE_AGAIN_BODY: ({ car }) =>
            `Buona notizia! ${car || "Un veicolo salvato"} precedentemente segnato come venduto è di nuovo disponibile.`,

        NEW_MATCHING_VEHICLE: "Nuovo veicolo corrispondente trovato",
        NEW_MATCHING_VEHICLE_BODY: ({ car, searchName }) =>
            `Un nuovo annuncio corrispondente alla tua ricerca salvata "${searchName || "ricerca salvata"}" è ora disponibile: ${car || "Visualizza"}.`,

        LISTING_PUBLISHED: "Annuncio pubblicato con successo",
        LISTING_PUBLISHED_BODY: ({ car }) =>
            `Congratulazioni! Il tuo annuncio per ${car || "il tuo veicolo"} è ora attivo su CarZone.`,

        INCOMPLETE_LISTING_REMINDER: "Completa il tuo annuncio",
        INCOMPLETE_LISTING_REMINDER_BODY: ({ car }) =>
            `Hai una bozza di annuncio per ${car || "il tuo veicolo"}. Completala per raggiungere acquirenti!`,

        LISTING_EXPIRING_SOON: "Annuncio in scadenza a breve",
        LISTING_EXPIRING_SOON_BODY: ({ car, days }) =>
            `Il tuo annuncio per ${car || "il tuo veicolo"} scadrà tra ${days} giorno/i. Rinnova ora per mantenerlo visibile.`,

        LISTING_EXPIRED: "Annuncio scaduto",
        LISTING_EXPIRED_BODY: ({ car }) =>
            `Il tuo annuncio per ${car || "il tuo veicolo"} è scaduto. Rinnova il piano per riattivarlo.`,

        LISTING_REJECTED: "Annuncio rifiutato",
        LISTING_REJECTED_BODY: ({ car, reason }) =>
            `Il tuo annuncio per ${car || "il tuo veicolo"} è stato rifiutato: ${reason || "Non conforme alle linee guida."}`,

        LISTING_EXTENDED: "Annuncio prolungato con successo",
        LISTING_EXTENDED_BODY: ({ car }) =>
            `Il tuo annuncio per ${car || "il tuo veicolo"} è stato prolungato con successo.`,

        ACCOUNT_SECURITY_ALERT: "Avviso di sicurezza dell'account",
        ACCOUNT_SECURITY_ALERT_BODY: ({ activity }) =>
            `Avviso di sicurezza: ${activity || "La password del tuo account è stata modificata."} Se non sei stato tu, contatta l'assistenza.`,

        SYSTEM_ANNOUNCEMENT: ({ title }) => title || "Comunicazione di sistema",
        SYSTEM_ANNOUNCEMENT_BODY: ({ body }) => body || "Aggiornamento della piattaforma CarZone.",

        SELLER_MONTHLY_CHECKIN: "Verifica disponibilità veicolo",
        SELLER_MONTHLY_CHECKIN_BODY: ({ car }) =>
            `Questo veicolo (${car || "il tuo veicolo"}) è ancora disponibile o è già stato venduto?`,

        NEW_CAR_LISTED: "Nuovo veicolo inserito",
        NEW_CAR_LISTED_BODY: "Un nuovo veicolo è stato inserito su CarZone.",

        PLAN_EXPIRED: "🚫 Piano scaduto",
        PLAN_EXPIRED_BODY: "Il tuo piano di abbonamento è scaduto.",

        PLAN_EXPIRY_REMINDER: "⏰ Promemoria scadenza piano",
        PLAN_EXPIRY_REMINDER_BODY: ({ days }) =>
            days ? `Il tuo piano di abbonamento scadrà tra ${days} giorno/i.` : "Il tuo piano di abbonamento scadrà tra 3 giorni.",

        NEW_PURCHASE_AGREEMENT: "Nuovo contratto di acquisto",
        NEW_PURCHASE_AGREEMENT_BODY: ({ name, car, offeredPrice }) =>
            `${name} ha inviato un contratto di acquisto per il tuo veicolo ${car}. Prezzo offerto: ${offeredPrice}.`,

        PURCHASE_AGREEMENT_REJECTED: "Contratto di acquisto rifiutato",
        PURCHASE_AGREEMENT_REJECTED_BODY: ({ name, car }) =>
            `${name} ha rifiutato il contratto di acquisto per il tuo veicolo ${car}.`,

        SLOT_REQUEST_APPROVED: "Richiesta slot approvata!",
        SLOT_REQUEST_APPROVED_BODY: ({ slots, price }) =>
            slots && price
                ? `La tua richiesta di ${slots} slot al prezzo di ${price} è stata approvata. Tocca per visualizzare il tuo nuovo piano personalizzato!`
                : "La tua richiesta di slot è stata approvata! Tocca per visualizzare il tuo nuovo piano.",

        SLOT_REQUEST_REJECTED: "Richiesta slot rifiutata",
        SLOT_REQUEST_REJECTED_BODY: "La tua richiesta di slot è stata rifiutata. Si prega di scegliere un altro slot disponibile.",

        SELLER_APPROVED: ({ fullName }) => `${fullName || "Venditore"} Approvato`,
        SELLER_APPROVED_BODY: ({ fullName }) => `Congratulazioni${fullName ? ', ' + fullName : ''}! Il tuo account venditore è stato approvato.`,

        SELLER_REJECTED: "Candidatura venditore rifiutata",
        SELLER_REJECTED_BODY: ({ fullName }) => `Spiacenti${fullName ? ', ' + fullName : ''}, la tua candidatura come venditore non è stata approvata.`,
    }
};

export const getNotificationTranslation = (
    language,
    titleKey,
    bodyKey,
    params = {}
) => {
    const lang = notificationTranslations[language] ? language : 'en';
    const translations = notificationTranslations[lang] || notificationTranslations.en;

    const titleEntry = translations[titleKey] || notificationTranslations.en[titleKey] || titleKey;
    const bodyEntry = translations[bodyKey] || notificationTranslations.en[bodyKey] || bodyKey;

    const title = typeof titleEntry === 'function' ? titleEntry(params) : titleEntry;
    const body = typeof bodyEntry === 'function' ? bodyEntry(params) : bodyEntry;

    return { title, body };
};
