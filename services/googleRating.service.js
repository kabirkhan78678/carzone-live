import axios from 'axios';
import db from '../config/db.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache Google rating for a single seller.
 * Strictly operates on 'company' account types only.
 * Private sellers will always return null for ratings.
 */
export const getSellerGoogleRatingData = async (sellerInput = {}) => {
    try {
        const userId = sellerInput.id || sellerInput.user_id || sellerInput.seller_id;
        const accountType = String(sellerInput.account_type || sellerInput.seller_type || sellerInput.accountType || '').trim().toLowerCase();

        // 1. Strict Privacy & Type Check: ONLY company sellers can have Google business ratings
        if (accountType !== 'company') {
            return {
                rating: null,
                google_rating: null,
                reviewsCount: null,
                google_review_count: null,
                google_place_id: null,
                is_company: false
            };
        }

        // Fast-path: If seller input already has valid rating from DB join (Zero DB query overhead)
        const existingRating = Number(sellerInput.google_rating ?? sellerInput.rating ?? 0);
        const existingCount = Number(sellerInput.google_review_count ?? sellerInput.reviewsCount ?? 0);
        const existingPlaceId = sellerInput.google_place_id || sellerInput.placeId || null;
        if (existingRating > 0) {
            return {
                rating: existingRating,
                google_rating: existingRating,
                reviewsCount: existingCount,
                google_review_count: existingCount,
                google_place_id: existingPlaceId,
                is_company: true
            };
        }

        if (!userId) {
            return {
                rating: null,
                google_rating: null,
                reviewsCount: null,
                google_review_count: null,
                google_place_id: null,
                is_company: true
            };
        }

        // 2. Check Database Cache
        const userRows = await db.query(
            `SELECT id, account_type, companyName, companyAddress, city, pincode, fullAddress, 
                    google_place_id, google_rating, google_review_count, google_rating_updated_at 
             FROM tbl_users 
             WHERE id = ? LIMIT 1`,
            [userId]
        );

        if (!userRows || !userRows[0]) {
            return {
                rating: null,
                google_rating: null,
                reviewsCount: null,
                google_review_count: null,
                google_place_id: null,
                is_company: true
            };
        }

        const user = userRows[0];
        const cachedRating = Number(user.google_rating || 0);
        const cachedReviewCount = Number(user.google_review_count || 0);
        const lastUpdated = user.google_rating_updated_at ? new Date(user.google_rating_updated_at).getTime() : 0;
        const isCacheValid = cachedRating > 0 && lastUpdated > 0 && (Date.now() - lastUpdated) < CACHE_TTL_MS;

        // Return valid cached rating immediately (Zero latency)
        if (isCacheValid) {
            return {
                rating: cachedRating,
                google_rating: cachedRating,
                reviewsCount: cachedReviewCount,
                google_review_count: cachedReviewCount,
                google_place_id: user.google_place_id || null,
                is_company: true
            };
        }

        // 3. Construct Search Query from Company Name & Address
        const companyName = user.companyName || sellerInput.companyName || sellerInput.company || sellerInput.name;
        const companyAddress = user.companyAddress || sellerInput.companyAddress || user.fullAddress || sellerInput.fullAddress || '';
        const city = user.city || sellerInput.city || '';
        const pincode = user.pincode || sellerInput.pincode || '';

        const searchQuery = [companyName, companyAddress, pincode, city, 'Switzerland']
            .filter(Boolean)
            .join(' ')
            .trim();

        if (!searchQuery) {
            return {
                rating: cachedRating > 0 ? cachedRating : null,
                google_rating: cachedRating > 0 ? cachedRating : null,
                reviewsCount: cachedReviewCount > 0 ? cachedReviewCount : null,
                google_review_count: cachedReviewCount > 0 ? cachedReviewCount : null,
                google_place_id: user.google_place_id || null,
                is_company: true
            };
        }

        // 4. Query Google Places API (With 3-second safe timeout)
        let placeId = user.google_place_id || null;
        let rating = null;
        let reviewsCount = null;

        if (GOOGLE_API_KEY) {
            try {
                // If we already have place_id, query details
                if (placeId) {
                    const detailsRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                        params: {
                            place_id: placeId,
                            fields: 'rating,user_ratings_total',
                            key: GOOGLE_API_KEY
                        },
                        timeout: 3000
                    });

                    if (detailsRes.data?.result) {
                        rating = detailsRes.data.result.rating ? Number(detailsRes.data.result.rating) : null;
                        reviewsCount = detailsRes.data.result.user_ratings_total ? Number(detailsRes.data.result.user_ratings_total) : null;
                    }
                }

                // If no rating found yet, try Places Search
                if (rating === null) {
                    // Try Places API (New)
                    try {
                        const newPlacesRes = await axios.post(
                            'https://places.googleapis.com/v1/places:searchText',
                            { textQuery: searchQuery },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Goog-Api-Key': GOOGLE_API_KEY,
                                    'X-Goog-FieldMask': 'places.id,places.rating,places.userRatingCount'
                                },
                                timeout: 3000
                            }
                        );

                        const firstPlace = newPlacesRes.data?.places?.[0];
                        if (firstPlace) {
                            placeId = firstPlace.id || placeId;
                            rating = firstPlace.rating ? Number(firstPlace.rating) : null;
                            reviewsCount = firstPlace.userRatingCount ? Number(firstPlace.userRatingCount) : null;
                        }
                    } catch (newApiErr) {
                        // Fallback to Legacy Find Place if New API is not enabled
                        const legacyRes = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
                            params: {
                                input: searchQuery,
                                inputtype: 'textquery',
                                fields: 'place_id,rating,user_ratings_total',
                                key: GOOGLE_API_KEY
                            },
                            timeout: 3000
                        });

                        const candidate = legacyRes.data?.candidates?.[0];
                        if (candidate) {
                            placeId = candidate.place_id || placeId;
                            rating = candidate.rating ? Number(candidate.rating) : null;
                            reviewsCount = candidate.user_ratings_total ? Number(candidate.user_ratings_total) : null;
                        }
                    }
                }
            } catch (googleApiErr) {
                console.warn('[googleRating.service] Google Places API query skipped/error:', googleApiErr.message);
            }
        }

        // 5. Update Database Cache if valid data returned
        if (rating !== null) {
            await db.query(
                `UPDATE tbl_users 
                 SET google_place_id = COALESCE(?, google_place_id), 
                     google_rating = ?, 
                     google_review_count = ?, 
                     google_rating_updated_at = NOW() 
                 WHERE id = ?`,
                [placeId, rating, reviewsCount || 0, userId]
            );
        } else if (cachedRating > 0) {
            // Keep existing cached value if external API call didn't succeed
            rating = cachedRating;
            reviewsCount = cachedReviewCount;
        }

        return {
            rating: rating !== null ? rating : null,
            google_rating: rating !== null ? rating : null,
            reviewsCount: reviewsCount !== null ? reviewsCount : null,
            google_review_count: reviewsCount !== null ? reviewsCount : null,
            google_place_id: placeId,
            is_company: true
        };

    } catch (err) {
        console.error('[googleRating.service] getSellerGoogleRatingData error:', err.message);
        return {
            rating: null,
            google_rating: null,
            reviewsCount: null,
            google_review_count: null,
            google_place_id: null,
            is_company: true
        };
    }
};

/**
 * Batch enrich multiple car listing items with cached company seller ratings.
 * Avoids N+1 queries by fetching all seller ratings in a single query.
 */
export const batchEnrichCarsWithGoogleRating = async (cars = []) => {
    if (!Array.isArray(cars) || cars.length === 0) {
        return cars;
    }

    try {
        const userIds = [
            ...new Set(
                cars
                    .filter((c) => {
                        const type = String(c.seller_type || c.sellerDetails?.sellerType || c.account_type || '').toLowerCase();
                        return type === 'company';
                    })
                    .map((c) => c.user_id || c.seller_id || c.sellerDetails?.sellerId)
                    .filter(Boolean)
            )
        ];

        if (userIds.length === 0) {
            return cars;
        }

        const placeholders = userIds.map(() => '?').join(',');
        const rows = await db.query(
            `SELECT id, google_rating, google_review_count, google_place_id 
             FROM tbl_users 
             WHERE id IN (${placeholders})`,
            userIds
        );

        const ratingMap = new Map();
        for (const r of rows || []) {
            const rNum = Number(r.google_rating || 0);
            const countNum = Number(r.google_review_count || 0);
            ratingMap.set(Number(r.id), {
                rating: rNum > 0 ? rNum : null,
                google_rating: rNum > 0 ? rNum : null,
                reviewsCount: countNum > 0 ? countNum : null,
                google_review_count: countNum > 0 ? countNum : null,
                google_place_id: r.google_place_id || null
            });
        }

        for (const car of cars) {
            const sid = Number(car.user_id || car.seller_id || car.sellerDetails?.sellerId);
            const type = String(car.seller_type || car.sellerDetails?.sellerType || car.account_type || '').toLowerCase();

            if (type === 'company' && ratingMap.has(sid)) {
                const rData = ratingMap.get(sid);
                car.rating = rData.rating;
                car.google_rating = rData.google_rating;
                car.reviewsCount = rData.reviewsCount;
                car.google_review_count = rData.google_review_count;

                if (car.sellerDetails) {
                    car.sellerDetails.rating = rData.rating;
                    car.sellerDetails.google_rating = rData.google_rating;
                    car.sellerDetails.reviewsCount = rData.reviewsCount;
                    car.sellerDetails.google_review_count = rData.google_review_count;
                }
            } else if (car.sellerDetails) {
                car.sellerDetails.rating = null;
                car.sellerDetails.google_rating = null;
                car.sellerDetails.reviewsCount = null;
                car.sellerDetails.google_review_count = null;
            }
        }

        return cars;
    } catch (err) {
        console.warn('[googleRating.service] batchEnrichCarsWithGoogleRating error:', err.message);
        return cars;
    }
};
