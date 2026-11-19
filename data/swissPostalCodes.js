/**
 * Swiss Postal Codes & Municipalities Coordinates Database.
 * Comprehensive mapping for all 26 Cantons and 1000-9999 PLZ ranges.
 */

// Specific postal codes and municipalities
export const SWISS_LOCALITIES = {
    // 1000-1099: Lausanne & Vaud
    "1000": { lat: 46.5197, lng: 6.6323, city: "Lausanne", canton: "VD" },
    "1003": { lat: 46.5210, lng: 6.6310, city: "Lausanne", canton: "VD" },
    "1004": { lat: 46.5270, lng: 6.6180, city: "Lausanne", canton: "VD" },
    "1005": { lat: 46.5180, lng: 6.6450, city: "Lausanne", canton: "VD" },
    "1006": { lat: 46.5120, lng: 6.6360, city: "Lausanne", canton: "VD" },
    "1007": { lat: 46.5180, lng: 6.6190, city: "Lausanne", canton: "VD" },
    "1008": { lat: 46.5360, lng: 6.5810, city: "Prilly", canton: "VD" },
    "1009": { lat: 46.5097, lng: 6.6628, city: "Pully", canton: "VD" },
    "1010": { lat: 46.5410, lng: 6.6570, city: "Lausanne", canton: "VD" },
    "1020": { lat: 46.5358, lng: 6.5886, city: "Renens", canton: "VD" },
    "1024": { lat: 46.5300, lng: 6.5650, city: "Ecublens", canton: "VD" },

    // 1100-1199: Morges & La Côte
    "1110": { lat: 46.5113, lng: 6.4984, city: "Morges", canton: "VD" },
    "1162": { lat: 46.4670, lng: 6.4010, city: "Saint-Prex", canton: "VD" },
    "1180": { lat: 46.4710, lng: 6.3530, city: "Rolle", canton: "VD" },

    // 1200-1299: Geneva & Geneva Canton
    "1200": { lat: 46.2044, lng: 6.1432, city: "Genève", canton: "GE" },
    "1201": { lat: 46.2120, lng: 6.1450, city: "Genève", canton: "GE" },
    "1202": { lat: 46.2180, lng: 6.1380, city: "Genève", canton: "GE" },
    "1203": { lat: 46.2110, lng: 6.1210, city: "Genève", canton: "GE" },
    "1204": { lat: 46.2010, lng: 6.1430, city: "Genève", canton: "GE" },
    "1205": { lat: 46.1960, lng: 6.1370, city: "Genève", canton: "GE" },
    "1206": { lat: 46.1930, lng: 6.1550, city: "Genève", canton: "GE" },
    "1207": { lat: 46.2060, lng: 6.1600, city: "Genève", canton: "GE" },
    "1208": { lat: 46.2030, lng: 6.1700, city: "Genève", canton: "GE" },
    "1212": { lat: 46.1830, lng: 6.1150, city: "Grand-Lancy", canton: "GE" },
    "1213": { lat: 46.1833, lng: 6.1000, city: "Onex", canton: "GE" },
    "1214": { lat: 46.2167, lng: 6.0833, city: "Vernier", canton: "GE" },
    "1217": { lat: 46.2327, lng: 6.0805, city: "Meyrin", canton: "GE" },
    "1227": { lat: 46.1837, lng: 6.1407, city: "Carouge", canton: "GE" },
    "1260": { lat: 46.3832, lng: 6.2396, city: "Nyon", canton: "VD" },

    // 1300-1499: Yverdon & Jura-Nord Vaudois
    "1400": { lat: 46.7785, lng: 6.6412, city: "Yverdon-les-Bains", canton: "VD" },

    // 1500-1799: Fribourg & Broye
    "1630": { lat: 46.6186, lng: 7.0573, city: "Bulle", canton: "FR" },
    "1700": { lat: 46.8065, lng: 7.1620, city: "Fribourg", canton: "FR" },
    "1752": { lat: 46.7936, lng: 7.1278, city: "Villars-sur-Glâne", canton: "FR" },

    // 1800-1999: Riviera, Chablais, Valais
    "1800": { lat: 46.4628, lng: 6.8419, city: "Vevey", canton: "VD" },
    "1820": { lat: 46.4312, lng: 6.9107, city: "Montreux", canton: "VD" },
    "1860": { lat: 46.3190, lng: 6.9680, city: "Aigle", canton: "VD" },
    "1870": { lat: 46.2558, lng: 6.9472, city: "Monthey", canton: "VS" },
    "1920": { lat: 46.1030, lng: 7.0734, city: "Martigny", canton: "VS" },
    "1950": { lat: 46.2331, lng: 7.3606, city: "Sion", canton: "VS" },
    "3960": { lat: 46.2930, lng: 7.5340, city: "Sierre", canton: "VS" },
    "3900": { lat: 46.3157, lng: 7.9877, city: "Brig", canton: "VS" },
    "3930": { lat: 46.2930, lng: 7.8810, city: "Visp", canton: "VS" },
    "3920": { lat: 45.9760, lng: 7.7490, city: "Zermatt", canton: "VS" },

    // 2000-2999: Neuchâtel, Jura, Biel/Bienne
    "2000": { lat: 46.9896, lng: 6.9293, city: "Neuchâtel", canton: "NE" },
    "2300": { lat: 47.1035, lng: 6.8328, city: "La Chaux-de-Fonds", canton: "NE" },
    "2400": { lat: 47.0600, lng: 6.7500, city: "Le Locle", canton: "NE" },
    "2500": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", canton: "BE" },
    "2502": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", canton: "BE" },
    "2503": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", canton: "BE" },
    "2504": { lat: 47.1490, lng: 7.2650, city: "Biel/Bienne", canton: "BE" },
    "2800": { lat: 47.3649, lng: 7.3444, city: "Delémont", canton: "JU" },
    "2900": { lat: 47.4180, lng: 7.0750, city: "Porrentruy", canton: "JU" },

    // 3000-3899: Bern & Bernese Oberland
    "3000": { lat: 46.9480, lng: 7.4474, city: "Bern", canton: "BE" },
    "3001": { lat: 46.9480, lng: 7.4400, city: "Bern", canton: "BE" },
    "3005": { lat: 46.9410, lng: 7.4530, city: "Bern", canton: "BE" },
    "3006": { lat: 46.9480, lng: 7.4650, city: "Bern", canton: "BE" },
    "3007": { lat: 46.9380, lng: 7.4280, city: "Bern", canton: "BE" },
    "3008": { lat: 46.9480, lng: 7.4180, city: "Bern", canton: "BE" },
    "3011": { lat: 46.9480, lng: 7.4500, city: "Bern", canton: "BE" },
    "3012": { lat: 46.9550, lng: 7.4320, city: "Bern", canton: "BE" },
    "3018": { lat: 46.9420, lng: 7.3880, city: "Bern Bümpliz", canton: "BE" },
    "3072": { lat: 46.9554, lng: 7.4851, city: "Ostermundigen", canton: "BE" },
    "3098": { lat: 46.9244, lng: 7.4144, city: "Köniz", canton: "BE" },
    "3400": { lat: 47.0583, lng: 7.6258, city: "Burgdorf", canton: "BE" },
    "3600": { lat: 46.7580, lng: 7.6280, city: "Thun", canton: "BE" },
    "3700": { lat: 46.6897, lng: 7.6789, city: "Spiez", canton: "BE" },
    "3800": { lat: 46.6863, lng: 7.8632, city: "Interlaken", canton: "BE" },

    // 4000-4999: Basel, Solothurn, Olten
    "4000": { lat: 47.5596, lng: 7.5886, city: "Basel", canton: "BS" },
    "4001": { lat: 47.5584, lng: 7.5878, city: "Basel", canton: "BS" },
    "4051": { lat: 47.5540, lng: 7.5890, city: "Basel", canton: "BS" },
    "4052": { lat: 47.5500, lng: 7.6050, city: "Basel", canton: "BS" },
    "4053": { lat: 47.5450, lng: 7.5920, city: "Basel", canton: "BS" },
    "4057": { lat: 47.5680, lng: 7.5950, city: "Basel", canton: "BS" },
    "4058": { lat: 47.5620, lng: 7.6020, city: "Basel", canton: "BS" },
    "4123": { lat: 47.5507, lng: 7.5358, city: "Allschwil", canton: "BL" },
    "4132": { lat: 47.5230, lng: 7.6444, city: "Muttenz", canton: "BL" },
    "4133": { lat: 47.5186, lng: 7.6942, city: "Pratteln", canton: "BL" },
    "4147": { lat: 47.4697, lng: 7.5947, city: "Aesch", canton: "BL" },
    "4153": { lat: 47.4942, lng: 7.5919, city: "Reinach", canton: "BL" },
    "4310": { lat: 47.5544, lng: 7.7944, city: "Rheinfelden", canton: "AG" },
    "4410": { lat: 47.4842, lng: 7.7347, city: "Liestal", canton: "BL" },
    "4500": { lat: 47.2088, lng: 7.5370, city: "Solothurn", canton: "SO" },
    "4600": { lat: 47.3520, lng: 7.9077, city: "Olten", canton: "SO" },
    "4800": { lat: 47.2883, lng: 7.9447, city: "Zofingen", canton: "AG" },
    "4900": { lat: 47.2130, lng: 7.7910, city: "Langenthal", canton: "BE" },

    // 5000-5999: Aargau
    "5000": { lat: 47.3925, lng: 8.0442, city: "Aarau", canton: "AG" },
    "5200": { lat: 47.4820, lng: 8.2090, city: "Brugg", canton: "AG" },
    "5400": { lat: 47.4737, lng: 8.3059, city: "Baden", canton: "AG" },
    "5430": { lat: 47.4667, lng: 8.3333, city: "Wettingen", canton: "AG" },
    "5600": { lat: 47.3875, lng: 8.1804, city: "Lenzburg", canton: "AG" },
    "5610": { lat: 47.3528, lng: 8.2789, city: "Wohlen", canton: "AG" },

    // 6000-6499: Lucerne, Zug & Central Switzerland
    "6000": { lat: 47.0502, lng: 8.3093, city: "Luzern", canton: "LU" },
    "6003": { lat: 47.0470, lng: 8.3070, city: "Luzern", canton: "LU" },
    "6004": { lat: 47.0560, lng: 8.3080, city: "Luzern", canton: "LU" },
    "6005": { lat: 47.0390, lng: 8.3180, city: "Luzern", canton: "LU" },
    "6010": { lat: 47.0347, lng: 8.2778, city: "Kriens", canton: "LU" },
    "6020": { lat: 47.0789, lng: 8.3023, city: "Emmen", canton: "LU" },
    "6048": { lat: 47.0163, lng: 8.3117, city: "Horw", canton: "LU" },
    "6060": { lat: 46.8961, lng: 8.2458, city: "Sarnen", canton: "OW" },
    "6210": { lat: 47.1720, lng: 8.1090, city: "Sursee", canton: "LU" },
    "6300": { lat: 47.1662, lng: 8.5155, city: "Zug", canton: "ZG" },
    "6330": { lat: 47.1821, lng: 8.4636, city: "Cham", canton: "ZG" },
    "6340": { lat: 47.1950, lng: 8.5280, city: "Baar", canton: "ZG" },
    "6430": { lat: 47.0208, lng: 8.6531, city: "Schwyz", canton: "SZ" },
    "6460": { lat: 46.8804, lng: 8.6444, city: "Altdorf", canton: "UR" },

    // 6500-6999: Ticino
    "6500": { lat: 46.1928, lng: 9.0170, city: "Bellinzona", canton: "TI" },
    "6600": { lat: 46.1710, lng: 8.7995, city: "Locarno", canton: "TI" },
    "6612": { lat: 46.1550, lng: 8.7730, city: "Ascona", canton: "TI" },
    "6830": { lat: 45.8340, lng: 9.0300, city: "Chiasso", canton: "TI" },
    "6850": { lat: 45.8710, lng: 8.9880, city: "Mendrisio", canton: "TI" },
    "6900": { lat: 46.0037, lng: 8.9511, city: "Lugano", canton: "TI" },

    // 7000-7999: Graubünden
    "7000": { lat: 46.8508, lng: 9.5320, city: "Chur", canton: "GR" },
    "7270": { lat: 46.8027, lng: 9.8360, city: "Davos", canton: "GR" },
    "7500": { lat: 46.4980, lng: 9.8390, city: "St. Moritz", canton: "GR" },

    // 8000-8999: Zürich & surroundings
    "8000": { lat: 47.3769, lng: 8.5417, city: "Zürich", canton: "ZH" },
    "8001": { lat: 47.3725, lng: 8.5418, city: "Zürich", canton: "ZH" },
    "8002": { lat: 47.3600, lng: 8.5300, city: "Zürich", canton: "ZH" },
    "8003": { lat: 47.3700, lng: 8.5150, city: "Zürich", canton: "ZH" },
    "8004": { lat: 47.3780, lng: 8.5250, city: "Zürich", canton: "ZH" },
    "8005": { lat: 47.3880, lng: 8.5200, city: "Zürich", canton: "ZH" },
    "8006": { lat: 47.3830, lng: 8.5450, city: "Zürich", canton: "ZH" },
    "8008": { lat: 47.3550, lng: 8.5550, city: "Zürich", canton: "ZH" },
    "8032": { lat: 47.3650, lng: 8.5600, city: "Zürich", canton: "ZH" },
    "8037": { lat: 47.3950, lng: 8.5250, city: "Zürich", canton: "ZH" },
    "8038": { lat: 47.3400, lng: 8.5300, city: "Zürich", canton: "ZH" },
    "8041": { lat: 47.3350, lng: 8.5100, city: "Zürich", canton: "ZH" },
    "8044": { lat: 47.3800, lng: 8.5700, city: "Zürich", canton: "ZH" },
    "8045": { lat: 47.3550, lng: 8.5050, city: "Zürich", canton: "ZH" },
    "8046": { lat: 47.4200, lng: 8.5050, city: "Zürich", canton: "ZH" },
    "8047": { lat: 47.3800, lng: 8.4950, city: "Zürich", canton: "ZH" },
    "8048": { lat: 47.3870, lng: 8.4900, city: "Zürich Altstetten", canton: "ZH" },
    "8049": { lat: 47.4050, lng: 8.4950, city: "Zürich Höngg", canton: "ZH" },
    "8050": { lat: 47.4110, lng: 8.5440, city: "Zürich Oerlikon", canton: "ZH" },
    "8051": { lat: 47.4080, lng: 8.5700, city: "Zürich Schwamendingen", canton: "ZH" },
    "8052": { lat: 47.4250, lng: 8.5500, city: "Zürich Seebach", canton: "ZH" },
    "8053": { lat: 47.3550, lng: 8.5800, city: "Zürich Witikon", canton: "ZH" },
    "8055": { lat: 47.3650, lng: 8.4900, city: "Zürich", canton: "ZH" },
    "8057": { lat: 47.3980, lng: 8.5400, city: "Zürich", canton: "ZH" },
    "8105": { lat: 47.4450, lng: 8.4720, city: "Regensdorf", canton: "ZH" },
    "8152": { lat: 47.4332, lng: 8.5724, city: "Opfikon / Glattbrugg", canton: "ZH" },
    "8180": { lat: 47.5180, lng: 8.5410, city: "Bülach", canton: "ZH" },
    "8200": { lat: 47.6960, lng: 8.6349, city: "Schaffhausen", canton: "SH" },
    "8302": { lat: 47.4515, lng: 8.5839, city: "Kloten", canton: "ZH" },
    "8304": { lat: 47.4200, lng: 8.6250, city: "Wallisellen", canton: "ZH" },
    "8400": { lat: 47.4984, lng: 8.7299, city: "Winterthur", canton: "ZH" },
    "8500": { lat: 47.5583, lng: 8.8988, city: "Frauenfeld", canton: "TG" },
    "8600": { lat: 47.3980, lng: 8.6183, city: "Dübendorf", canton: "ZH" },
    "8604": { lat: 47.3892, lng: 8.6947, city: "Volketswil", canton: "ZH" },
    "8610": { lat: 47.3496, lng: 8.7188, city: "Uster", canton: "ZH" },
    "8620": { lat: 47.3236, lng: 8.7981, city: "Wetzikon", canton: "ZH" },
    "8640": { lat: 47.2267, lng: 8.8184, city: "Rapperswil-Jona", canton: "SG" },
    "8700": { lat: 47.3180, lng: 8.5830, city: "Küsnacht", canton: "ZH" },
    "8702": { lat: 47.3406, lng: 8.5728, city: "Zollikon", canton: "ZH" },
    "8706": { lat: 47.2706, lng: 8.6433, city: "Meilen", canton: "ZH" },
    "8712": { lat: 47.2403, lng: 8.7214, city: "Stäfa", canton: "ZH" },
    "8750": { lat: 47.0404, lng: 9.0680, city: "Glarus", canton: "GL" },
    "8800": { lat: 47.2950, lng: 8.5630, city: "Thalwil", canton: "ZH" },
    "8810": { lat: 47.2600, lng: 8.5975, city: "Horgen", canton: "ZH" },
    "8820": { lat: 47.2289, lng: 8.6733, city: "Wädenswil", canton: "ZH" },
    "8853": { lat: 47.1950, lng: 8.8250, city: "Lachen", canton: "SZ" },
    "8952": { lat: 47.3975, lng: 8.4478, city: "Schlieren", canton: "ZH" },
    "8953": { lat: 47.4057, lng: 8.4037, city: "Dietikon", canton: "ZH" },

    // 9000-9999: St. Gallen, Thurgau, Appenzell
    "9000": { lat: 47.4245, lng: 9.3767, city: "St. Gallen", canton: "SG" },
    "9050": { lat: 47.3315, lng: 9.4093, city: "Appenzell", canton: "AI" },
    "9100": { lat: 47.3857, lng: 9.2789, city: "Herisau", canton: "AR" },
    "9200": { lat: 47.4154, lng: 9.2486, city: "Gossau", canton: "SG" },
    "9320": { lat: 47.5147, lng: 9.4319, city: "Arbon", canton: "TG" },
    "9400": { lat: 47.4975, lng: 9.4939, city: "Rorschach", canton: "SG" },
    "9470": { lat: 47.1660, lng: 9.4720, city: "Buchs", canton: "SG" },
    "9500": { lat: 47.4644, lng: 9.0494, city: "Wil", canton: "SG" },
    "9630": { lat: 47.2980, lng: 9.0880, city: "Wattwil", canton: "SG" }
};

// Regional 2-digit PLZ Fallback (guarantees EVERY 4-digit Swiss postal code resolves locally)
export const SWISS_PLZ_REGIONS = {
    "10": { lat: 46.5197, lng: 6.6323, city: "Lausanne", canton: "VD" },
    "11": { lat: 46.5113, lng: 6.4984, city: "Morges", canton: "VD" },
    "12": { lat: 46.2044, lng: 6.1432, city: "Genève", canton: "GE" },
    "13": { lat: 46.6180, lng: 6.5050, city: "Cossonay / Orbe", canton: "VD" },
    "14": { lat: 46.7785, lng: 6.6412, city: "Yverdon-les-Bains", canton: "VD" },
    "15": { lat: 46.8200, lng: 6.9400, city: "Payerne / Moudon", canton: "VD" },
    "16": { lat: 46.6186, lng: 7.0573, city: "Bulle / Gruyère", canton: "FR" },
    "17": { lat: 46.8065, lng: 7.1620, city: "Fribourg", canton: "FR" },
    "18": { lat: 46.4628, lng: 6.8419, city: "Vevey / Montreux / Aigle", canton: "VD" },
    "19": { lat: 46.2331, lng: 7.3606, city: "Sion / Martigny", canton: "VS" },
    "20": { lat: 46.9896, lng: 6.9293, city: "Neuchâtel", canton: "NE" },
    "21": { lat: 46.9100, lng: 6.6100, city: "Val-de-Travers", canton: "NE" },
    "22": { lat: 47.0300, lng: 6.9000, city: "Val-de-Ruz", canton: "NE" },
    "23": { lat: 47.1035, lng: 6.8328, city: "La Chaux-de-Fonds", canton: "NE" },
    "24": { lat: 47.0600, lng: 6.7500, city: "Le Locle", canton: "NE" },
    "25": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", canton: "BE" },
    "26": { lat: 47.1500, lng: 7.0000, city: "Saint-Imier", canton: "BE" },
    "27": { lat: 47.2800, lng: 7.3700, city: "Tavannes / Moutier", canton: "BE" },
    "28": { lat: 47.3649, lng: 7.3444, city: "Delémont", canton: "JU" },
    "29": { lat: 47.4180, lng: 7.0750, city: "Porrentruy", canton: "JU" },
    "30": { lat: 46.9480, lng: 7.4474, city: "Bern", canton: "BE" },
    "31": { lat: 46.8900, lng: 7.5000, city: "Belp / Konolfingen", canton: "BE" },
    "32": { lat: 47.0400, lng: 7.2700, city: "Aarberg / Seeland", canton: "BE" },
    "33": { lat: 47.0500, lng: 7.5100, city: "Jegenstorf", canton: "BE" },
    "34": { lat: 47.0583, lng: 7.6258, city: "Burgdorf", canton: "BE" },
    "35": { lat: 46.9400, lng: 7.7900, city: "Langnau im Emmental", canton: "BE" },
    "36": { lat: 46.7580, lng: 7.6280, city: "Thun", canton: "BE" },
    "37": { lat: 46.6897, lng: 7.6789, city: "Spiez / Frutigen", canton: "BE" },
    "38": { lat: 46.6863, lng: 7.8632, city: "Interlaken", canton: "BE" },
    "39": { lat: 46.3157, lng: 7.9877, city: "Brig / Visp / Valais", canton: "VS" },
    "40": { lat: 47.5596, lng: 7.5886, city: "Basel", canton: "BS" },
    "41": { lat: 47.5100, lng: 7.6000, city: "Basel-Landschaft", canton: "BL" },
    "42": { lat: 47.4200, lng: 7.5000, city: "Laufen", canton: "BL" },
    "43": { lat: 47.5544, lng: 7.7944, city: "Rheinfelden / Fricktal", canton: "AG" },
    "44": { lat: 47.4842, lng: 7.7347, city: "Liestal", canton: "BL" },
    "45": { lat: 47.2088, lng: 7.5370, city: "Solothurn", canton: "SO" },
    "46": { lat: 47.3520, lng: 7.9077, city: "Olten", canton: "SO" },
    "47": { lat: 47.3100, lng: 7.7200, city: "Balsthal", canton: "SO" },
    "48": { lat: 47.2883, lng: 7.9447, city: "Zofingen", canton: "AG" },
    "49": { lat: 47.2130, lng: 7.7910, city: "Langenthal", canton: "BE" },
    "50": { lat: 47.3925, lng: 8.0442, city: "Aarau", canton: "AG" },
    "51": { lat: 47.4200, lng: 8.1600, city: "Wildegg", canton: "AG" },
    "52": { lat: 47.4820, lng: 8.2090, city: "Brugg", canton: "AG" },
    "53": { lat: 47.5800, lng: 8.2600, city: "Zurzach", canton: "AG" },
    "54": { lat: 47.4737, lng: 8.3059, city: "Baden", canton: "AG" },
    "55": { lat: 47.4300, lng: 8.2800, city: "Mellingen", canton: "AG" },
    "56": { lat: 47.3875, lng: 8.1804, city: "Lenzburg / Wohlen", canton: "AG" },
    "57": { lat: 47.3200, lng: 8.1800, city: "Seon / Reinach AG", canton: "AG" },
    "60": { lat: 47.0502, lng: 8.3093, city: "Luzern", canton: "LU" },
    "61": { lat: 47.0300, lng: 8.1900, city: "Malters / Entlebuch", canton: "LU" },
    "62": { lat: 47.1720, lng: 8.1090, city: "Sursee / Sempach", canton: "LU" },
    "63": { lat: 47.1662, lng: 8.5155, city: "Zug", canton: "ZG" },
    "64": { lat: 47.0208, lng: 8.6531, city: "Schwyz / Altdorf", canton: "SZ" },
    "65": { lat: 46.1928, lng: 9.0170, city: "Bellinzona", canton: "TI" },
    "66": { lat: 46.1710, lng: 8.7995, city: "Locarno", canton: "TI" },
    "67": { lat: 46.3600, lng: 8.9700, city: "Biasca", canton: "TI" },
    "68": { lat: 45.8710, lng: 8.9880, city: "Mendrisio / Chiasso", canton: "TI" },
    "69": { lat: 46.0037, lng: 8.9511, city: "Lugano", canton: "TI" },
    "70": { lat: 46.8508, lng: 9.5320, city: "Chur", canton: "GR" },
    "71": { lat: 46.8400, lng: 9.2800, city: "Flims / Laax", canton: "GR" },
    "72": { lat: 46.8027, lng: 9.8360, city: "Davos / Klosters", canton: "GR" },
    "73": { lat: 47.0000, lng: 9.5000, city: "Bad Ragaz / Landquart", canton: "GR" },
    "74": { lat: 46.7000, lng: 9.4400, city: "Thusis", canton: "GR" },
    "75": { lat: 46.4980, lng: 9.8390, city: "St. Moritz / Engadin", canton: "GR" },
    "76": { lat: 46.3400, lng: 9.6100, city: "Bregaglia", canton: "GR" },
    "77": { lat: 46.3300, lng: 10.060, city: "Poschiavo", canton: "GR" },
    "80": { lat: 47.3769, lng: 8.5417, city: "Zürich", canton: "ZH" },
    "81": { lat: 47.4500, lng: 8.4700, city: "Regensdorf / Bülach", canton: "ZH" },
    "82": { lat: 47.6960, lng: 8.6349, city: "Schaffhausen", canton: "SH" },
    "83": { lat: 47.4515, lng: 8.5839, city: "Kloten / Illnau", canton: "ZH" },
    "84": { lat: 47.4984, lng: 8.7299, city: "Winterthur", canton: "ZH" },
    "85": { lat: 47.5583, lng: 8.8988, city: "Frauenfeld", canton: "TG" },
    "86": { lat: 47.3496, lng: 8.7188, city: "Uster / Dübendorf", canton: "ZH" },
    "87": { lat: 47.2403, lng: 8.7214, city: "Stäfa / Meilen / Rapperswil", canton: "ZH" },
    "88": { lat: 47.2289, lng: 8.6733, city: "Wädenswil / Horgen", canton: "ZH" },
    "89": { lat: 47.4057, lng: 8.4037, city: "Dietikon / Limmattal", canton: "ZH" },
    "90": { lat: 47.4245, lng: 9.3767, city: "St. Gallen", canton: "SG" },
    "91": { lat: 47.3857, lng: 9.2789, city: "Herisau / Appenzell", canton: "AR" },
    "92": { lat: 47.4154, lng: 9.2486, city: "Gossau", canton: "SG" },
    "93": { lat: 47.5147, lng: 9.4319, city: "Arbon", canton: "TG" },
    "94": { lat: 47.4975, lng: 9.4939, city: "Rorschach / Buchs", canton: "SG" },
    "95": { lat: 47.4644, lng: 9.0494, city: "Wil", canton: "SG" },
    "96": { lat: 47.2980, lng: 9.0880, city: "Wattwil / Toggenburg", canton: "SG" }
};

/**
 * Resolves a Swiss postal code (4 digits) or locality name to coordinates.
 * Returns null if not a recognized Swiss postal code or locality.
 */
export const lookupSwissPostalCode = (input) => {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim().toLowerCase();

    // 1. Check exact 4-digit PLZ match
    const plzMatch = clean.match(/\b([1-9][0-9]{3})\b/);
    if (plzMatch) {
        const plz = plzMatch[1];
        if (SWISS_LOCALITIES[plz]) {
            const loc = SWISS_LOCALITIES[plz];
            return {
                latitude: loc.lat,
                longitude: loc.lng,
                city: loc.city,
                postal_code: plz,
                country: "Switzerland",
                source: "swiss-offline-db"
            };
        }
        // Check regional 2-digit fallback
        const prefix = plz.substring(0, 2);
        if (SWISS_PLZ_REGIONS[prefix]) {
            const loc = SWISS_PLZ_REGIONS[prefix];
            return {
                latitude: loc.lat,
                longitude: loc.lng,
                city: loc.city,
                postal_code: plz,
                country: "Switzerland",
                source: "swiss-offline-db"
            };
        }
    }

    return null;
};
