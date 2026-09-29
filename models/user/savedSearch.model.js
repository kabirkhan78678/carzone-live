import db from '../../config/db.js';

export const createSavedSearch = async (userId, searchName, filters = {}) => {
  const jsonFilters = typeof filters === 'string' ? filters : JSON.stringify(filters);
  const sql = `
    INSERT INTO tbl_saved_searches (user_id, search_name, filters)
    VALUES (?, ?, ?)
  `;
  const result = await db.query(sql, [userId, searchName || 'My Saved Search', jsonFilters]);
  return {
    id: result.insertId,
    user_id: userId,
    search_name: searchName || 'My Saved Search',
    filters: typeof filters === 'string' ? JSON.parse(filters) : filters
  };
};

export const getUserSavedSearches = async (userId) => {
  const rows = await db.query(
    `SELECT id, user_id, search_name, filters, is_active, created_at, updated_at
     FROM tbl_saved_searches
     WHERE user_id = ? AND is_active = 1
     ORDER BY id DESC`,
    [userId]
  );
  return (rows || []).map(row => ({
    ...row,
    filters: typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters
  }));
};

export const deleteSavedSearch = async (userId, id) => {
  const result = await db.query(
    `DELETE FROM tbl_saved_searches WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result.affectedRows > 0;
};

/**
 * Check a newly published car against all active saved searches
 */
export const findMatchingSavedSearches = async (car) => {
  try {
    const rows = await db.query(
      `SELECT id, user_id, search_name, filters
       FROM tbl_saved_searches
       WHERE is_active = 1 AND user_id != ?`,
      [car.user_id || 0]
    );

    if (!rows || rows.length === 0) return [];

    const carBrand = String(car.brandName || car.brand_name || '').trim().toLowerCase();
    const carModel = String(car.carModel || car.model || '').trim().toLowerCase();
    const carPrice = parseFloat(String(car.selling_price || car.totalPrice || '0').replace(/[^0-9.]/g, '')) || 0;
    const carYear = parseInt(car.selectYear || (car.first_registration_date ? new Date(car.first_registration_date).getFullYear() : 0), 10);
    const carFuelTypeId = car.fuel_type_id ? Number(car.fuel_type_id) : null;
    const carTransmissionId = car.transmission_id ? Number(car.transmission_id) : null;
    const carBodyTypeId = car.body_type_id ? Number(car.body_type_id) : null;

    const matches = [];

    for (const row of rows) {
      const filters = typeof row.filters === 'string' ? JSON.parse(row.filters) : (row.filters || {});

      // Brand match
      if (filters.brandName && carBrand) {
        if (Array.isArray(filters.brandName)) {
          const brandList = filters.brandName.map(b => String(b).trim().toLowerCase());
          if (!brandList.includes(carBrand)) continue;
        } else {
          const fBrand = String(filters.brandName).trim().toLowerCase();
          if (fBrand !== carBrand) continue;
        }
      }
      if (filters.brand_id && car.brand_id) {
        if (Number(filters.brand_id) !== Number(car.brand_id)) continue;
      }

      // Model match
      if (filters.carModel && carModel) {
        if (Array.isArray(filters.carModel)) {
          const modelList = filters.carModel.map(m => String(m).trim().toLowerCase());
          const hasMatch = modelList.some(m => carModel.includes(m) || m.includes(carModel));
          if (!hasMatch) continue;
        } else {
          const fModel = String(filters.carModel).trim().toLowerCase();
          if (!carModel.includes(fModel) && !fModel.includes(carModel)) continue;
        }
      }

      // Price range match
      if (filters.min_price || filters.priceMin) {
        const minP = parseFloat(filters.min_price || filters.priceMin);
        if (carPrice < minP) continue;
      }
      if (filters.max_price || filters.priceMax) {
        const maxP = parseFloat(filters.max_price || filters.priceMax);
        if (carPrice > maxP) continue;
      }

      // Year range match
      if (filters.min_year || filters.yearMin) {
        const minY = parseInt(filters.min_year || filters.yearMin, 10);
        if (carYear < minY) continue;
      }
      if (filters.max_year || filters.yearMax) {
        const maxY = parseInt(filters.max_year || filters.yearMax, 10);
        if (carYear > maxY) continue;
      }

      // Fuel type match
      if (filters.fuel_type_id && carFuelTypeId) {
        if (Number(filters.fuel_type_id) !== carFuelTypeId) continue;
      }

      // Transmission match
      if (filters.transmission_id && carTransmissionId) {
        if (Number(filters.transmission_id) !== carTransmissionId) continue;
      }

      // Body type match
      if (filters.body_type_id && carBodyTypeId) {
        if (Number(filters.body_type_id) !== carBodyTypeId) continue;
      }

      matches.push({
        saved_search_id: row.id,
        user_id: row.user_id,
        search_name: row.search_name
      });
    }

    return matches;
  } catch (err) {
    console.error('Error finding matching saved searches:', err);
    return [];
  }
};
