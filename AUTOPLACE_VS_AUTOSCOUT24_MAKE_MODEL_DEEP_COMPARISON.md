# 🚗 AutoPlace vs AutoScout24 Switzerland: Exhaustive Overall Make & Model Catalog Comparison

> **Target Standard**: [AutoScout24 Switzerland](https://www.autoscout24.ch/en/s/advanced) (Official Swiss Market Master Catalogue: 408 Makes / 5,932 Models)  
> **Source Data**: AutoPlace Master Database (`tbl_vehicle_catalog_brands` & `tbl_vehicle_catalog_models`: 189 Brands / 8,307 Models) vs AutoScout24 Switzerland Master Catalogue  
> **Prepared For**: Client Review & System-Wide Alignment  
> **Date**: November 2026  

---

## 📌 1. Purpose & Client Objective

### Client Motivation
The primary business objective is to ensure **AutoPlace offers the exact same vehicle classification, makes, models, and filter coverage as AutoScout24 Switzerland**—the indisputable industry standard in Switzerland.

The client's strict requirement is:
> *"AutoPlace mein jitni bhi make model hai wo same AutoScout24 mein rahey, aur AutoScout24 ke saare makes aur models AutoPlace mein available hon."*

This document provides the **exhaustive, 100% complete catalog comparison** covering:
1. **All 105 Common Brands** that exist in both platforms with their model counts and alignment status.
2. **All 304 Brands** in AutoScout24 that must be added to AutoPlace.
3. **All 84 Brands** in AutoPlace that are heavy commercial trucks or motorcycles.
4. **Car-by-car audit** of all 31 active listings currently in AutoPlace.
5. Exact **ADD, CHANGE, REMOVE, and KEEP** actions.

---

## 📊 2. Executive Summary: Platform Comparison at a Glance

| Functional Area | AutoPlace (Current State) | AutoScout24 Switzerland | Action Required |
| :--- | :---: | :---: | :--- |
| **Vehicle Categories** | Cars only (No category filter) | **6 Categories** *(Cars, Campers, Utility, Trucks, Trailers, Motorcycles)* | **ADD** category selector & 5 categories |
| **Total Makes / Brands** | **189 Brands** in DB catalog | **408 Makes** in Swiss catalog | **ADD** 303 missing makes to reach 408 |
| **Common Matching Brands** | **105 Brands** | **105 Brands** | **KEEP & ALIGN** model rosters |
| **Total Models** | **8,307 Models** (incl. commercial) | **5,932 Models** (Cars category) | **ALIGN** with AutoScout24 catalogue |
| **Passenger Models** | **2,853 Models** | **5,932 Models** | **EXPAND** passenger car models |
| **Commercial / Utility Models**| **5,451 Models** | Separate "Utility" category | **SEPARATE** into dedicated Utility tab |
| **Model Selection UI** | Free text / Single select | **Multi-select + Exclude Model checkbox** | **ADD** multi-select & exclude option |
| **Version / Trim Box** | Mixed into Model string | Dedicated **"Add Version"** keyword box | **ADD** dedicated Version text filter |
| **Body Types** | 7 Types | **9 Types** *(Compact car, SUV, Sedan, Estate, Coupé, Cabrio, Pick-up, Minivan, Van)* | **ADD** 3 body types, **REMOVE** 1 |
| **Fuel Types** | 13 Flat types (2 wrong codes) | **14 Types** grouped into 5 collapsible trees | **GROUP** into trees & fix 2 swapped DB codes |
| **Transmission** | 5 Flat types | **4 Types** grouped into Automatic + Manual | **MERGE** 2 into 1, **ADD** group level |
| **Drive Types** | 4 Entries (2 are duplicates) | **3 Options** *(All-wheel 4x4, Front-wheel, Rear-wheel)* | **MERGE** ID 3 & ID 5 duplicates |
| **Vehicle Condition** | 6 Conditions + 3 States | **3 Groups** *(Classic, New [with 3 sub-types], Used)* | **ALIGN** condition structure |
| **Accident Status** | 2 Statuses | **2 Checkboxes** *(Damaged vs Accident-free)* | **CHANGE** UI labels to Swiss standard |
| **Inspection & Warranty** | 3 Entries (includes CH Car) | **2 Checkboxes** *(Inspected MFK, With Warranty)* | **REMOVE** CH Car from MFK filter |
| **Colors** | 19 Colors with Hex | **19 Colors** with Swatches | **KEEP** colors, **ADD** Exclude color toggle |
| **Standard Equipment** | 6 Niche tuning/wheel extras | **100+ Standard Options** (Navi, Sunroof, Leather, 360° Cam, Towbar, CarPlay) | **ADD** 100 standard automotive features |

---

## 📊 3. Exhaustive Brand-by-Brand & Model Comparison (All 493 Unique Brands)

### 3.1 All 105 Common Brands (Existing in Both AutoPlace & AutoScout24)

| # | Brand / Make | AutoScout24 Models | AutoPlace Models | AutoScout24 Sample Models | AutoPlace Sample Models | Alignment Action |
| :-: | :--- | :---: | :---: | :--- | :--- | :--- |
| 1 | **IVECO** | **7** | **1976** | 50C, 70C), Campagnola, Daily (35S, Daily 4x4 | Daily 29 L 10 DK.-Ch. 3450, Daily 29 L 10 K.-Ch. 3000, Daily 29 L 10 K.-Ch. 3450, Daily 29 L 10V Kaw.3000, Daily 29 L 10V Kaw.3000 h.1.9 | Separate utility/chassis variants |
| 2 | **MERCEDES-BENZ** | **228** | **1247** | 190 Class (2), 240 Class (1), 300 Class / E Class (6), A180, A200 | A-Klasse V177 Limousine, A-Klasse W168, A-Klasse W168 lang, A-Klasse W169, A-Klasse W176 | Separate utility/chassis variants |
| 3 | **FIAT** | **84** | **618** | 124, 124 Familiale, 124 Saloon, 125, 126 | 124 Abarth Spider, 124 Spider, 126, 127, 131 Mirafiori | Separate utility/chassis variants |
| 4 | **FORD** | **189** | **361** | Aerostar, Aspire, B-Max, Bronco, Bronco II | B-Max, Bronco, C-Max, Capri, Courier Kombi | Separate utility/chassis variants |
| 5 | **VW** | **136** | **352** | AMAROK, Amarok, Ameo, Arteon, Arteon Shooting Brake | Amarok DKab. Kipper, Amarok DKab. Pick-up, Amarok DKab. Pritsche, Amarok Kipper, Amarok Pick-up | Separate utility/chassis variants |
| 6 | **CITROEN** | **52** | **344** | CITROEN 2CV, CITROEN AMI, CITROEN AX, CITROEN Axel, CITROEN BX | 2CV6, AMI, AX, BX, BX Break | Separate utility/chassis variants |
| 7 | **OPEL** | **50** | **337** | Adam, Adam Rocks, Agila, Ampera, Antara | Adam, Agila, Ampera, Ampera-e, Antara | Separate utility/chassis variants |
| 8 | **NISSAN** | **106** | **331** | 100 NX, 200 SX, 200SX, 240SX, 300 ZX | 100 NX, 200 SX, 280 ZX, 300 ZX, 350 Z Coupé | Separate utility/chassis variants |
| 9 | **PEUGEOT** | **59** | **331** | 1007, 104, 106, 107, 108 | 1007, 104, 104 Coupé, 106, 107 | Separate utility/chassis variants |
| 10 | **RENAULT** | **82** | **320** | 11, 12, 14, 16, 18 | Alaskan Pick-up, Alpine A 310, Alpine A 610, Alpine V6 GT, Arkana | Separate utility/chassis variants |
| 11 | **HONDA** | **291** | **43** | 1300, ACCORD, ACCORD CROSSTOUR, AQUATRAX F-12, AQUATRAX F-12X | Accord, Accord Aerodeck, Accord Coupé, Accord Sedan, Accord Tourer | Import missing models from AS24 |
| 12 | **BMW** | **259** | **145** | 1 SERIES M, 1 Series, 1 Series (3), 1 Series M, 118I | 1er Reihe E81, 1er Reihe E82 Coupé, 1er Reihe E87, 1er Reihe E88 Cabrio, 1er Reihe F20 | Import missing models from AS24 |
| 13 | **TOYOTA** | **105** | **214** | 4RUNNER, 4Runner, AVALON, AVANZA, Agya | 4-Runner, Auris, Auris Touring Sports, Avensis Liftback, Avensis Sedan | Separate utility/chassis variants |
| 14 | **SUZUKI** | **183** | **42** | AERIO, AN400 BURGMAN, AN400 BURGMAN ABS, AN650 BURGMAN, AN650A BURGMAN ABS | Across, Alto, Baleno, Baleno Sedan, Baleno Wagon | Import missing models from AS24 |
| 15 | **CHEVROLET** | **168** | **55** | ASTRA, ASTRO, AVALANCHE, AVALANCHE 1500, AVALANCHE 2500 | Alero, Astro, Astro Cargo, Aveo, Beretta | Import missing models from AS24 |
| 16 | **AUDI** | **99** | **123** | 100, 100/ 200, 100/ 200 Avant, 200, 4000 | 100, 100 Avant, 200, 200 Avant, 80 | Separate utility/chassis variants |
| 17 | **CAN-AM** | **108** | **0** | COMMANDER 1000, COMMANDER 1000 DPS, COMMANDER 1000 LTD, COMMANDER 1000 X, COMMANDER 1000 XT | — | Import missing models from AS24 |
| 18 | **PORSCHE** | **108** | **25** | 718, 718 Boxster, 718 Boxster GTS, 718 Boxster S, 718 Cayman | 718 Boxster, 718 Cayman, 911 Cabriolet, 911 Coupé, 911 Speedster | Import missing models from AS24 |
| 19 | **DODGE** | **96** | **5** | 400, 600, ATOS, ATTITUDE, AVENGER | Avenger, Caliber, Journey, Nitro, Viper | Import missing models from AS24 |
| 20 | **KTM** | **96** | **0** | 105 SX, 1190 ADVENTURE, 1190 ADVENTURE R, 1190 RC8, 1190 RC8 R | — | Import missing models from AS24 |
| 21 | **FERRARI** | **93** | **47** | 12Cilindri, 288 GTO/F40/F50/Enzo/LaFerrari, 296 GTB, 296 GTS, 296 Speciale | 12 Cilindri, 12 Cilindri Spider, 296 GTB, 296 GTS, 328 | Import missing models from AS24 |
| 22 | **HYUNDAI** | **79** | **76** | ACCENT, AZERA, Accent, Atos, Atos Multi | Accent, Atos, Atos Prime, Bayon, Coupé | Import missing models from AS24 |
| 23 | **KIA** | **75** | **56** | AMANTI, Amanti, BORREGO, Borrego, Borrego / Mohave | Carens, Carnival, Cee\, Ceed, Ceed SW | Import missing models from AS24 |
| 24 | **MAZDA** | **72** | **60** | 121, 2, 2 / Demio, 3, 3 / Axela | 121, 2, 3, 3 Hatchback, 3 Sedan | Import missing models from AS24 |
| 25 | **TRIUMPH** | **69** | **0** | ADVENTURER, AMERICA, AMERICA CLASSIC, Acclaim, BONNEVILLE | — | Import missing models from AS24 |
| 26 | **LEXUS** | **63** | **18** | CT, CT Models (1), CT200H, ES, ES Models (5) | CT, ES, GS, GS F, IS | Import missing models from AS24 |
| 27 | **MITSUBISHI** | **57** | **62** | 3000 GT, 3000GT, ASX / RVR / Outlander Sport, Attrage, Carisma | 3000 GT, ASX, Attrage, Canter FB 35 250 Kab.-Ch., Canter FB 35 295 Kab.-Ch. | Separate utility/chassis variants |
| 28 | **VOLVO** | **58** | **59** | 142, 144, 145, 240, 244 | 240, 240 Kombi, 340, 360, 440 | Separate utility/chassis variants |
| 29 | **INFINITI** | **51** | **15** | EX, EX Models (2), EX35, EX37, FX | EX, FX, G, G Cabrio, G Coupé | Import missing models from AS24 |
| 30 | **ALFA ROMEO** | **50** | **37** | 145, 146, 147, 155, 156 | 145, 146, 147, 155, 156 | Import missing models from AS24 |
| 31 | **CADILLAC** | **49** | **28** | ATS, ATS-V, Allante, BLS, Brougham | ATS, ATS Coupé, ATS-V, ATS-V Coupé, Allanté | Import missing models from AS24 |
| 32 | **ISUZU** | **47** | **46** | 117, ASCENDER, AXIOM, Amigo, Amigo Cabrio | D-Max Crew Pick-up, D-Max EV Crew Pick-up, D-Max EV Space Pick-up, D-Max Single Pick-up, D-Max Space Pick-up | Import missing models from AS24 |
| 33 | **BUICK** | **46** | **10** | ALLURE, CENTURY, Cascada, Century, ENCLAVE | Century, Electra, Park Avenue, Regal, Regal Coupé | Import missing models from AS24 |
| 34 | **CHRYSLER** | **45** | **25** | 200, 300, 300C, 300M, ASPEN | 300 C, 300 C Touring, 300 M, Crossfire Coupé, Crossfire Roadster | Import missing models from AS24 |
| 35 | **PONTIAC** | **45** | **11** | 1000, 6000, AZTEK, Aztek, BONNEVILLE | 6000, 6000 Estate, Bonneville, Firebird, Firebird Convertible | Import missing models from AS24 |
| 36 | **ASTON MARTIN** | **44** | **37** | Cygnet, DB AR1, DB11, DB11 Volante, DB12 | Cygnet, DB11 Coupé, DB11 Volante, DB12 Coupé, DB12 Volante | Import missing models from AS24 |
| 37 | **SUBARU** | **44** | **37** | 360, Ascent, B9 TRIBECA, BAJA, BRZ | 1600, 1800, 1800 Coupé, 1800 Station, 1800 Super-Station | Import missing models from AS24 |
| 38 | **SKODA** | **20** | **41** | Citigo, Citigo-e iV, Enyaq Coupé iV, Enyaq iV, Fabia | 105, 120, 120 Coupé, 130, 130 Coupé | Separate utility/chassis variants |
| 39 | **SEAT** | **38** | **30** | ALHAMBRA, ALTEA, ALTEA XL, Alhambra, Altea | Alhambra, Altea, Altea Freetrack, Altea XL, Arona | Import missing models from AS24 |
| 40 | **BMW-ALPINA** | **16** | **36** | B10, B12, B3, B4, B5 | B10, B10 Touring, B12, B3, B3 Cabriolet | Separate utility/chassis variants |
| 41 | **LANCIA** | **33** | **28** | 037, 2000, A112, A112 Abarth, Aurelia | A 112, Beta, Beta HPE, Dedra, Dedra Station Wagon | Import missing models from AS24 |
| 42 | **JAGUAR** | **30** | **29** | E-Pace, F-Pace, F-Pace SVR, F-TYPE, F-Type | E-Pace, F-Pace, F-Type Convertible, F-Type Coupé, I-Pace | Import missing models from AS24 |
| 43 | **DACIA** | **29** | **14** | 1100, 1300, 1300 Break, 1310, 1310 Break | Bigster, Dokker, Dokker Pick-up, Dokker Van, Duster | Import missing models from AS24 |
| 44 | **JEEP** | **29** | **11** | Avenger, CHEROKEE, CJ, COMMANDER, COMPASS | Avenger, CJ-7, CJ-8, Cherokee, Commander | Import missing models from AS24 |
| 45 | **MAXUS** | **5** | **29** | Mifa 9, T90 EV, eDeliver 3, eDeliver 7, eDeliver 9 | Deliver 7 Kaw. L1H1, Deliver 7 Kaw. L2H1, Deliver 9 Kab.-Ch. L3, Deliver 9 Kab.-Ch. L4, Deliver 9 Kaw. L3H2 | Separate utility/chassis variants |
| 46 | **LAND ROVER** | **26** | **28** | DEFENDER, DISCOVERY, Defender, Defender 110, Defender 130 | 109, 110, 88, 90, Defender 110 | Separate utility/chassis variants |
| 47 | **LAMBORGHINI** | **27** | **18** | 350 GTS, AVENTADOR, Aventador, Centenario, Countach | Aventador, Aventador Roadster, Diablo GT, Diablo SE, Diablo SV | Import missing models from AS24 |
| 48 | **MASERATI** | **27** | **18** | 430, Biturbo, Bora, COUPE, Coupe | 3200, Biturbo, Biturbo Spyder, Coupé, Ghibli | Import missing models from AS24 |
| 49 | **MG** | **26** | **27** | Cyberster, F/ TF, GS, HS, IM5 | (Austin) MG Maestro, (Austin) MG Metro, (Austin) MG Montego, 3, 4 | Separate utility/chassis variants |
| 50 | **PIAGGIO** | **16** | **27** | Ape 50, Ape Calessino, Ape Classic, BV TOURER 250, FLY 150 | Ape Kaw., Ape Kipper, Ape Kombi, Ape Pick-up, Maxxi Kab.-Ch. | Separate utility/chassis variants |
| 51 | **OLDSMOBILE** | **26** | **6** | 442, 88, 88 (Eighty-Eight), 98 (Ninety-Eight), ALERO | Cutlass, Cutlass Coupé, Cutlass Wagon, Delta 88, Ninety | Import missing models from AS24 |
| 52 | **MINI** | **19** | **25** | Aceman, COOPER, COOPER COUNTRYMAN, COOPER PACEMAN, COUNTRYMAN | (Austin) Mini, Aceman J05, Cabrio F57, Cabrio F67, Cabrio R52 | Separate utility/chassis variants |
| 53 | **BENTLEY** | **24** | **18** | ARNAGE, AZURE, Arnage, Azure, BROOKLANDS | Arnage, Arnage R, Arnage T, Azure, Bentayga | Import missing models from AS24 |
| 54 | **DAIHATSU** | **18** | **24** | Altis, Applause, Ayla, Charade, Copen | Applause, Charade, Charade Sedan, Charmant, Copen Roadster | Separate utility/chassis variants |
| 55 | **SMART** | **24** | **10** | #1, #3, #5, 1, 3 | 1, 3, 5, City-Cabrio, City-Coupé | Import missing models from AS24 |
| 56 | **ROLLS-ROYCE** | **23** | **14** | Arcadia, CORNICHE, Camargue, Corniche, Cullinan | Corniche, Cullinan, Dawn, Ghost, Park Ward | Import missing models from AS24 |
| 57 | **ROVER** | **15** | **23** | 100 Cabrio, 100 Series (Metro), 200 Series, 25, 400 Series | 114, 200, 214, 216, 216 Cabriolet | Separate utility/chassis variants |
| 58 | **TATA** | **22** | **4** | Harrier, Indica, Indigo, MOTORS Altroz, MOTORS Aria | Indica, Safari, Tata Double Cab Pick-up, Tata Single Cab Pick-up | Import missing models from AS24 |
| 59 | **DFSK** | **8** | **21** | EC31, EC35, Fengon 500, Fengon 580, Fengon 7 | C-Serie Pick-up C31, C-Serie Pick-up DKab C32, C-Serie Van C35, K-Serie Kab.-Ch. K01H, K-Serie Kipper K01H | Separate utility/chassis variants |
| 60 | **DAEWOO** | **19** | **15** | Cielo, Damas II, Espero, G2X, Gentra | Espero, Evanda, Kalos, Kalos Sedan, Korando | Import missing models from AS24 |
| 61 | **MORGAN** | **19** | **8** | 3 Wheeler, 3 wheeler, 4/4, 4/4 2 Seater, 4/4 4 Seater | 4/4, Aero 8, Midsummer, Plus 8, Plus Four | Import missing models from AS24 |
| 62 | **LOTUS** | **18** | **15** | 2 Eleven, 3 Eleven, ELISE, ESPRIT, EVORA | Elan, Elan Cabriolet, Eletre, Elise, Emeya | Import missing models from AS24 |
| 63 | **SAAB** | **17** | **17** | 9-2X, 9-3, 9-3 Aero, 9-3 Sport, 9-3 SportCombi | 9-3, 9-3 Cabriolet, 9-3 Sport, 9-3 Sport Combi, 9-3X | Exact model count match |
| 64 | **BYD** | **5** | **16** | ATTO 2, ATTO 3, DOLPHIN, Sealion 7, Shark | Atto 2, Atto 2 DM-i, Atto 3, Atto 3 EVO, Denza D9 GT DM-i | Separate utility/chassis variants |
| 65 | **LADA** | **16** | **12** | 110, 111, 112, 2105, 2107) | 110, 111 Kombi, 112, 1300, 1500 | Import missing models from AS24 |
| 66 | **TVR** | **16** | **7** | "Wedge Series", 3000M, Cerbera, Chimaera, Grantura | Cerbera, Chimaera 400, Chimaera 500, Griffith 500, T350 | Import missing models from AS24 |
| 67 | **DS AUTOMOBILES** | **15** | **11** | AUTOMOBILES DS 3, AUTOMOBILES DS 3 Cabrio, AUTOMOBILES DS 3 Crossback, AUTOMOBILES DS 4, AUTOMOBILES DS 5 | DS3, DS3 Cabrio, DS3 Crossback, DS4, DS4 Crossback | Import missing models from AS24 |
| 68 | **MAN** | **6** | **14** | TGE 3.140, TGE 3.180, TGL, TGM, TGS | TGE DKab.-Ch. 3.5 t 3640, TGE DKab.-Ch. 3.5 t 4490, TGE Kab.-Ch. 3.0 t 3640, TGE Kab.-Ch. 3.0 t 4490, TGE Kab.-Ch. 3.5 t 3640 | Separate utility/chassis variants |
| 69 | **CATERHAM** | **13** | **2** | 21, CSR, Classic, Roadsport, Seven 160 | Seven, Super Seven | Import missing models from AS24 |
| 70 | **AUSTIN** | **12** | **3** | 1100, 1300, Allegro, Cambridge, Healey Sprite | Maestro, Metro, Montego Estate | Import missing models from AS24 |
| 71 | **HUMMER** | **12** | **3** | EV Pickup, EV SUV, H1, H1 2 Door Hardtop, H1 4 Door | H2, H3, H3T | Import missing models from AS24 |
| 72 | **ALPINE** | **10** | **3** | A110, A110 GT, A110 R, A110 S, A110S | A110, A290, A390 | Import missing models from AS24 |
| 73 | **GENESIS** | **10** | **7** | Electrified G80, Electrified GV70, G70, G70 Shooting Brake, G80 | G70, G70 Shooting Brake, G80, G90, GV60 | Import missing models from AS24 |
| 74 | **POLESTAR** | **10** | **5** | 1, 2, 3, 4, 5 | 1, 2, 3, 4, 5 | Import missing models from AS24 |
| 75 | **DAIMLER** | **9** | **6** | Century, Consort, DS420, Dart (SP250), Double Six | Double Six, Six, Six Century, Sovereign, Super Eight | Import missing models from AS24 |
| 76 | **JAC** | **8** | **9** | J7, S2, S3, S4, S7 | E30X, JS6, M3, RF8, T8 Pro | Separate utility/chassis variants |
| 77 | **TALBOT** | **9** | **7** | 1510, Horizon, Lago, Matra Murena, Matra Rancho | Horizon, Matra Murena, Matra Rancho, Samba, Samba Cabriolet | Import missing models from AS24 |
| 78 | **TESLA** | **9** | **4** | Cybertruck, Model 3, Model S, Model X, Model Y | Model 3, Model S, Model X, Model Y | Import missing models from AS24 |
| 79 | **AIXAM** | **8** | **6** | City, Coupé, Crossline, Crossover, GTO | A.721, A.751, Crossline, MAC 500 Cabriolet, eCity | Import missing models from AS24 |
| 80 | **CUPRA** | **8** | **7** | Ateca, Born, Formentor, Leon, Leon Sportstourer | Ateca, Born, Formentor, Leon, Leon ST | Import missing models from AS24 |
| 81 | **BAIC** | **7** | **5** | BJ40, BJ80, EU5, MOTOR BJ60, Senova D50 | BJ30, BJ40, BJ60, X55, X7 | Import missing models from AS24 |
| 82 | **ELARIS** | **5** | **7** | Beo, Dyo, Jaco, Lenn, Pio | Beo, Caro, Caro S, Dyo, Jaco | Separate utility/chassis variants |
| 83 | **LUCID** | **7** | **2** | Air Grand Touring, Air Pure, Air Sapphire, Air Touring, Gravity | Air, Gravity | Import missing models from AS24 |
| 84 | **LYNK & CO** | **7** | **3** | 01, 02, 03, 05, 06 | 01, 02, 08 | Import missing models from AS24 |
| 85 | **WESTFIELD** | **7** | **1** | Megablade, Megabusa, SEi, SEiW, SEight | Westfield | Import missing models from AS24 |
| 86 | **DE TOMASO** | **6** | **1** | Deauville, Guara, Longchamp, Mangusta, P72 | Pantera | Import missing models from AS24 |
| 87 | **FORTHING** | **3** | **6** | Friday EV, T5 EVO, U-Tour | 3, 4, 5, 7, 9 | Separate utility/chassis variants |
| 88 | **MEGA** | **6** | **3** | Club, Monte Carlo V12, Multitruck, Ranch, Track V12 | Club, Club Cabriolet, Club Coupé | Import missing models from AS24 |
| 89 | **XPENG** | **6** | **3** | G3, G6, G9, P5, P7 | G6, G9, P7+ | Import missing models from AS24 |
| 90 | **AMC** | **5** | **1** | Alliance, Concord, Eagle, Encore, Spirit | Eagle | Import missing models from AS24 |
| 91 | **DONGFENG** | **5** | **1** | AX7, Fengon 500, Fengon 580, Rich 6, T5 Evo | Box | Import missing models from AS24 |
| 92 | **INNOCENTI** | **5** | **1** | Elba, Koral, Lambretta, Mille, Mini | Mini | Import missing models from AS24 |
| 93 | **LEAPMOTOR** | **4** | **5** | C01, C10, C11, T03 | B05, B10, C10, T03, T03 Cargo | Separate utility/chassis variants |
| 94 | **PUCH** | **5** | **4** | 300 GD), 712), G-Modell (230 GE, Haflinger, Maxi | G-Modell, G-Modell Cabrio, G-Modell Wagon, GS-Modell | Import missing models from AS24 |
| 95 | **BAW** | **4** | **2** | Luba, Yuanbao, Yusheng, Zhanqi | 212, Pony | Import missing models from AS24 |
| 96 | **VOYAH** | **4** | **3** | Courage, Dreamer (Luxury MPV), Free (Electric SUV), Passion | Courage, Dream, Free | Import missing models from AS24 |
| 97 | **ZEEKR** | **4** | **4** | 001, 7GT, 7X, X | 001, 7GT, 7X, X | Exact model count match |
| 98 | **FISKER** | **3** | **2** | KARMA, Karma, Ocean | Karma, Ocean | Import missing models from AS24 |
| 99 | **INEOS** | **3** | **3** | Fusilier, Grenadier, Quartermaster | Grenadier, Grenadier Quartermaster, Grenadier Quartermaster Chassi | Exact model count match |
| 100 | **MICRO** | **3** | **1** | Microletta, Microlino 1.0, Microlino 2.0 | Microlino | Import missing models from AS24 |
| 101 | **MOBILIZE** | **3** | **1** | Bento, Duo, Limo | Duo | Import missing models from AS24 |
| 102 | **PGO** | **3** | **0** | Cevennes, Hemera, Speedster II | — | Import missing models from AS24 |
| 103 | **SERES** | **3** | **1** | Seres 3, Seres 5, Seres 7 | 5 | Import missing models from AS24 |
| 104 | **AIWAYS** | **2** | **2** | U5, U6 | U5, U6 | Exact model count match |
| 105 | **MHERO** | **1** | **1** | — | 1 | Exact model count match |

### 3.2 All 304 Missing Brands in AutoPlace (Available in AutoScout24 Switzerland - Need to Add)

These 304 vehicle makes exist in the official AutoScout24 Switzerland catalogue with full model rosters, but are currently missing from AutoPlace's database catalog:

| # | Brand / Make | AutoScout24 Models | Sample Models to Add into AutoPlace | Status |
| :-: | :--- | :---: | :--- | :---: |
| 1 | **1** | **770** | Models in catalog | **ADD MAKE & MODELS** |
| 2 | **GMC** | **73** | ACADIA, Acadia, B7, C3500, C3500HD | **ADD MAKE & MODELS** |
| 3 | **INTERNATIONAL** | **58** | 1652SC, 2554, 2574, 2654, 2674 | **ADD MAKE & MODELS** |
| 4 | **VAUXHALL** | **36** | Agila, Antara, Astra, Astra Sport Hatch, Astra Twin Top | **ADD MAKE & MODELS** |
| 5 | **HOLDEN** | **35** | Adventra, Astra, Astra Caravan, Astra TwinTop, Barina | **ADD MAKE & MODELS** |
| 6 | **PLYMOUTH** | **34** | ACCLAIM, Acclaim, Arrow, BREEZE, Barracuda | **ADD MAKE & MODELS** |
| 7 | **MERCURY** | **27** | COUGAR, Capri, Cougar, GRAND MARQUIS, Grand Marquis | **ADD MAKE & MODELS** |
| 8 | **LINCOLN** | **26** | AVIATOR, Aviator, BLACKWOOD, Blackwood, CONTINENTAL | **ADD MAKE & MODELS** |
| 9 | **ACURA** | **24** | ADX, CL, CL Models (4), CSX, EL | **ADD MAKE & MODELS** |
| 10 | **McLAREN** | **23** | 12C GT Sprint, 540C, 570GT, 570S, 600LT | **ADD MAKE & MODELS** |
| 11 | **DATSUN** | **17** | 200SX, 210, 280ZX, 300ZX, 310 | **ADD MAKE & MODELS** |
| 12 | **WIESMANN** | **15** | GT MF4, GT MF4-CS, GT MF4-S, GT MF5, MF3 | **ADD MAKE & MODELS** |
| 13 | **BUGATTI** | **14** | Bolide, Brouillard, Centodieci, Chiron, Destrier | **ADD MAKE & MODELS** |
| 14 | **SIMCA** | **13** | 1000, 1100, 1307, 1308, 1500 | **ADD MAKE & MODELS** |
| 15 | **CHANGAN** | **12** | Alsvin, CS15, CS35, CS55, CS75 | **ADD MAKE & MODELS** |
| 16 | **GEELY** | **12** | CK, Coolray, Emgrand, Emgrand EC7, Galaxy | **ADD MAKE & MODELS** |
| 17 | **GAC** | **11** | Aion S, Aion V, Aion Y, Emkoo, Emzoom | **ADD MAKE & MODELS** |
| 18 | **KOENIGSEGG** | **11** | Agera, CC8S, CCGT, CCR, CCX | **ADD MAKE & MODELS** |
| 19 | **NIO** | **10** | EC6, EC7, EL6, EL7, EL8 | **ADD MAKE & MODELS** |
| 20 | **STUDEBAKER** | **10** | Avanti, Champion, Commander, Cruiser, Daytona | **ADD MAKE & MODELS** |
| 21 | **UNIMOG** | **10** | 404 S, 406, 411, 421, U 20 | **ADD MAKE & MODELS** |
| 22 | **ZASTAVA** | **10** | 101, 128, 1300, 55, 65) | **ADD MAKE & MODELS** |
| 23 | **ALVIS** | **9** | 4.3 Litre, Crested Eagle, Firebird, Silver Crest, Speed 20 | **ADD MAKE & MODELS** |
| 24 | **AMERICAN MOTORS** | **9** | AMX, Eagle, Gremlin, Hornet, Javelin | **ADD MAKE & MODELS** |
| 25 | **KGM-SsangYong** | **9** | Korando, Korando e-Motion, Musso, Musso Grand, Rexton | **ADD MAKE & MODELS** |
| 26 | **SANTANA** | **9** | 300, 300 - 350, 350, Anibal, PS 10 Pickup | **ADD MAKE & MODELS** |
| 27 | **SPYKER** | **9** | C12 LaTurbie, C12 Zagato, C8, C8 Aileron, C8 Double 12 S | **ADD MAKE & MODELS** |
| 28 | **ARROWS** | **8** | A1, A10, A11, A2, A20 | **ADD MAKE & MODELS** |
| 29 | **CHERY** | **8** | Omoda 5, TIGGO 7, TIGGO 8, TIGGO 9, Tiggo 4 | **ADD MAKE & MODELS** |
| 30 | **DKW** | **8** | 3=6 (F93), F102, F12, Junior, Meisterklasse | **ADD MAKE & MODELS** |
| 31 | **FACEL VEGA** | **8** | Excellence, FV, FV1, FV2, FV3 | **ADD MAKE & MODELS** |
| 32 | **GINETTA** | **8** | Akula, G12, G15, G20, G4 | **ADD MAKE & MODELS** |
| 33 | **ISUZU (J)** | **8** | Bighorn, D-Max, MU-X, NPR, NQR | **ADD MAKE & MODELS** |
| 34 | **MORRIS** | **8** | Cowley, Eight, Ital, Marina, Mini | **ADD MAKE & MODELS** |
| 35 | **NSU** | **8** | 1000, Prinz, Prinz 4, Ro 80, Sport Prinz | **ADD MAKE & MODELS** |
| 36 | **PAGANI** | **8** | Huayra, Huayra BC, Imola, Utopia, Zonda | **ADD MAKE & MODELS** |
| 37 | **WOLSELEY** | **8** | 15/50, 15/60, 1500, 16/60, 18/85 | **ADD MAKE & MODELS** |
| 38 | **ALLARD** | **7** | Clipper, J2, J2X, K1, K2 | **ADD MAKE & MODELS** |
| 39 | **BERNA** | **7** | 2US, 2VM, C2, D250, D330 | **ADD MAKE & MODELS** |
| 40 | **BRISTOL** | **7** | 411, 412, 603, Blenheim, Bullet | **ADD MAKE & MODELS** |
| 41 | **DELAGE** | **7** | CO, D6, D6-70, D8, D8-120 | **ADD MAKE & MODELS** |
| 42 | **EDSEL** | **7** | Bermuda, Citation, Corsair, Pacer, Ranger | **ADD MAKE & MODELS** |
| 43 | **EXCALIBUR** | **7** | Phaeton, Roadster, Series I, Series II, Series III | **ADD MAKE & MODELS** |
| 44 | **HILLMAN** | **7** | Avenger, Hunter, Husky, Imp, Minx | **ADD MAKE & MODELS** |
| 45 | **HORCH** | **7** | 830, 830 BL, 850, 853, 853A | **ADD MAKE & MODELS** |
| 46 | **LIGIER** | **7** | Ambra, Ixo, JS50, JS60, Myli | **ADD MAKE & MODELS** |
| 47 | **MAHINDRA** | **7** | Bolero, Scorpio, Scorpio / GOA, Thar, Verito | **ADD MAKE & MODELS** |
| 48 | **MARCOS** | **7** | GT 3-Litre, LM500, Mantaray, Mantis, Mini Marcos | **ADD MAKE & MODELS** |
| 49 | **RUF** | **7** | BBR, CTR Yellowbird, CTR3, RGT, Rt 12 | **ADD MAKE & MODELS** |
| 50 | **VESPA** | **7** | GT 200 GRANTURISMO, GTS 250, GTS 300, GTS 300 SUPER, GTS 300 SUPER SPORT SE | **ADD MAKE & MODELS** |
| 51 | **WILLYS** | **7** | Aero Willys, CJ-2A, CJ-3A, MB (Jeep), Overland | **ADD MAKE & MODELS** |
| 52 | **AERO** | **6** | Aero 10, Aero 18, Aero 20, Aero 30, Aero 50 | **ADD MAKE & MODELS** |
| 53 | **AMILCAR** | **6** | CC, CGS, CGSS, CS, Compound | **ADD MAKE & MODELS** |
| 54 | **ARMSTRONG SIDDELEY** | **6** | Hurricane, Lancaster, Sapphire, Star Sapphire, Typhoon | **ADD MAKE & MODELS** |
| 55 | **AUTOBIANCHI** | **6** | A112, A112 Abarth, Bianchina, Primula, Stellina | **ADD MAKE & MODELS** |
| 56 | **AUTOMOBILES MARTINI** | **6** | MK20, MK23, MK31, MK34, MK37 | **ADD MAKE & MODELS** |
| 57 | **BERLIET** | **6** | 11CV, 22CV, 944, Dauphine, GLR | **ADD MAKE & MODELS** |
| 58 | **CHEVRON** | **6** | B16, B19, B21, B24, B36 | **ADD MAKE & MODELS** |
| 59 | **CORD** | **6** | 810, 812, Beverly, L-29, Phaeton | **ADD MAKE & MODELS** |
| 60 | **DE DION-BOUTON** | **6** | Torpedo, Type AL, Type G, Type K, Type Q | **ADD MAKE & MODELS** |
| 61 | **DELAHAYE** | **6** | 135, 135M, 135MS, 175, 178 | **ADD MAKE & MODELS** |
| 62 | **DONKERVOORT** | **6** | D10, D8, D8 GTO, F22, P24 | **ADD MAKE & MODELS** |
| 63 | **GLAS** | **6** | 1700, 2600 V8, 3000 V8, GT, Goggomobil | **ADD MAKE & MODELS** |
| 64 | **GOGGOMOBIL** | **6** | Coupé, T 250, TL 250 Transporter, TS 250, TS 300 | **ADD MAKE & MODELS** |
| 65 | **HEALEY** | **6** | Abbott, Duncan, Elliott, Silverstone, Tickford | **ADD MAKE & MODELS** |
| 66 | **HOTCHKISS** | **6** | 686, Anjou, Anthéor, Artois, Grégoire | **ADD MAKE & MODELS** |
| 67 | **JENSEN** | **6** | 541, C-V8, FF, GT, Healey | **ADD MAKE & MODELS** |
| 68 | **KYBURZ** | **6** | Classic, DXP (Swiss Post), Plus, eRod, eRod Fun | **ADD MAKE & MODELS** |
| 69 | **MATRA** | **6** | 530, Bagheera, Djet, Espace, Murena | **ADD MAKE & MODELS** |
| 70 | **MAYBACH** | **6** | 57, 62, EQS SUV, GLS-Class, Landaulet | **ADD MAKE & MODELS** |
| 71 | **MICROCAR** | **6** | Dué, M.Go, M8, MC1, MC2 | **ADD MAKE & MODELS** |
| 72 | **NASH** | **6** | Ambassador, Healey, Metropolitan, Rambler, STATESMAN | **ADD MAKE & MODELS** |
| 73 | **PACKARD** | **6** | Caribbean, Clipper, Custom Eight, One-Twenty, Patrician | **ADD MAKE & MODELS** |
| 74 | **PANTHER** | **6** | De Ville, J72, Kallista, Lima, Rio | **ADD MAKE & MODELS** |
| 75 | **RILEY** | **6** | Elf, One-Point-Five, Pathfinder, RMA, RMB | **ADD MAKE & MODELS** |
| 76 | **SAUBER** | **6** | C11, C12, C13, C24, C8 | **ADD MAKE & MODELS** |
| 77 | **SAURER** | **6** | 2DM, 2VM, 4DM, D330, L4C | **ADD MAKE & MODELS** |
| 78 | **SUNBEAM** | **6** | Alpine, Imp Sport, Lotus, Rapier, Talbot | **ADD MAKE & MODELS** |
| 79 | **TATRA** | **6** | T57, T603, T613, T700, T87 | **ADD MAKE & MODELS** |
| 80 | **ZAGATO** | **6** | Alfa Romeo SZ/RZ, Aston Martin Zagato, IsoRivolta GTZ, Mostro, Perana Z-One | **ADD MAKE & MODELS** |
| 81 | **ADLER** | **5** | Autobahn, Diplomat, Favorit, Trumpf, Trumpf Junior | **ADD MAKE & MODELS** |
| 82 | **AUBURN** | **5** | 120, 652, 851 Speedster, 852, Boattail Speedster | **ADD MAKE & MODELS** |
| 83 | **AUSTIN-HEALEY** | **5** | 100, 100-4, 100-6, 3000, Sprite | **ADD MAKE & MODELS** |
| 84 | **AVANTI** | **5** | AVANTI, Convertible, Coupe, II, Sedan | **ADD MAKE & MODELS** |
| 85 | **BERKELEY** | **5** | B105, B95, Bandit, Sports (SE328), T60 | **ADD MAKE & MODELS** |
| 86 | **BORGWARD** | **5** | BX5, BX7, Hansa 1500, Isabella, P100 | **ADD MAKE & MODELS** |
| 87 | **BRABHAM** | **5** | BT19, BT20, BT24, BT52, BT62 | **ADD MAKE & MODELS** |
| 88 | **CHECKER** | **5** | A11, Aerobus, Marathon, Superba, Taxicab | **ADD MAKE & MODELS** |
| 89 | **CIRELLI** | **5** | Cirelli 1, Cirelli 2, Cirelli 3, Cirelli 4, Cirelli 5 | **ADD MAKE & MODELS** |
| 90 | **DAF** | **5** | 33, 44, 46, 55, 66 | **ADD MAKE & MODELS** |
| 91 | **DELAUNAY BELLEVILLE** | **5** | HB4, O6, P4, Type 12, Type F | **ADD MAKE & MODELS** |
| 92 | **DENZA** | **5** | D9, N7, N8, Z9, Z9 GT | **ADD MAKE & MODELS** |
| 93 | **DESOTO** | **5** | Adventurer, Airflow, Custom, Firedome, Fireflite | **ADD MAKE & MODELS** |
| 94 | **FAW** | **5** | Bestune B70, Bestune T77, Bestune T99, Hongqi E-HS9, Hongqi H9 | **ADD MAKE & MODELS** |
| 95 | **FRANKLIN** | **5** | Airman, Olympic, Series 11, Series 9, Twelve | **ADD MAKE & MODELS** |
| 96 | **Graham** | **5** | Crusader, Hollywood, Model 97 Supercharged, Paige 610, Sharknose | **ADD MAKE & MODELS** |
| 97 | **GUMPERT** | **5** | Apollo, Apollo Enraged, Apollo S, Nathalie, Tornante | **ADD MAKE & MODELS** |
| 98 | **Gurgel** | **5** | BR-800, Carajás, Supermini, X-12, Xavante | **ADD MAKE & MODELS** |
| 99 | **HANOMAG** | **5** | 2/10 PS (Kommissbrot), Garant, Kurier, Partner, Rekord | **ADD MAKE & MODELS** |
| 100 | **HONGQI** | **5** | E-HS9, H5, H9, HS5, HS7 | **ADD MAKE & MODELS** |
| 101 | **HUDSON** | **5** | Commodore, Hornet, Pacemaker, Super Six, Wasp | **ADD MAKE & MODELS** |
| 102 | **INTERMECCANICA** | **5** | Griffith, Indra, Italia, Murena, Speedster Replica | **ADD MAKE & MODELS** |
| 103 | **ISO** | **5** | Fidia, Grifo, Isetta, Lele, Rivolta | **ADD MAKE & MODELS** |
| 104 | **KAISER** | **5** | Darrin, Dragon, Henry J, Manhattan, Special | **ADD MAKE & MODELS** |
| 105 | **LAGONDA** | **5** | 3-Litre, LG6, Rapide, Taraf, V12 | **ADD MAKE & MODELS** |
| 106 | **LOLA** | **5** | B05/40, II, III), T160, T212 | **ADD MAKE & MODELS** |
| 107 | **MARCH** | **5** | 701, 711, 721, 761, 811 | **ADD MAKE & MODELS** |
| 108 | **MONTEVERDI** | **5** | Hai 450, High Speed 375, Safari, Sahara, Tiara | **ADD MAKE & MODELS** |
| 109 | **PIERCE ARROW** | **5** | Model 36, Model 48, Model 66, Model 80, Silver Arrow | **ADD MAKE & MODELS** |
| 110 | **RADICAL** | **5** | RXC, SR1, SR10, SR3, SR8 | **ADD MAKE & MODELS** |
| 111 | **RELIANT** | **5** | Kitten, Regal, Rialto, Robin, Scimitar | **ADD MAKE & MODELS** |
| 112 | **RINSPEED** | **5** | Advantige, Bedouin, Chopster, Mono Ego, sQuba | **ADD MAKE & MODELS** |
| 113 | **SALMSON** | **5** | 2300 S, G72, Grand Sport, S4, VAL 3 | **ADD MAKE & MODELS** |
| 114 | **SBARRO** | **5** | Alcador, Challenge, Esperpera, Super Eight, Windhound | **ADD MAKE & MODELS** |
| 115 | **SINGER** | **5** | Chamoix, Gazelle, Nine, Ten, Vogue | **ADD MAKE & MODELS** |
| 116 | **STANDARD** | **5** | Eight, Flying, Pennant, Ten, Vanguard | **ADD MAKE & MODELS** |
| 117 | **STEYR** | **5** | Baby (Typ 50), Haflinger, Pinzgauer, Puch 500, Puch 650 TR | **ADD MAKE & MODELS** |
| 118 | **STUTZ** | **5** | Bearcat, Blackhawk, IV-Porte, Model A, Victoria | **ADD MAKE & MODELS** |
| 119 | **TAZZARI** | **5** | Zero, Zero City, Zero EM1, Zero EM2, Zero Junior | **ADD MAKE & MODELS** |
| 120 | **TOFAS** | **5** | Dogan, Kartal, Murat 124, Murat 131, Sahin | **ADD MAKE & MODELS** |
| 121 | **ULTIMA** | **5** | Can-Am, Evolution Convertible, Evolution Coupé, GTR, RS | **ADD MAKE & MODELS** |
| 122 | **VANDERHALL** | **5** | Brawley (4x4 EV), Carmel, Edison 2, Laguna, Venice | **ADD MAKE & MODELS** |
| 123 | **VENTURI** | **5** | 260, 300 Atlantique, 400 GT, Fetish, Transcup | **ADD MAKE & MODELS** |
| 124 | **ADR** | **4** | 02, 03, 04, 05 | **ADD MAKE & MODELS** |
| 125 | **BISCÚTER** | **4** | 100, 200-A, 200-C, Pegasín | **ADD MAKE & MODELS** |
| 126 | **BOND EQUIPE** | **4** | 2-Litre, 2-Litre Convertible, GT 2+2, GT 4S | **ADD MAKE & MODELS** |
| 127 | **BUGGY** | **4** | Apall, Meyers Manx, Secma, Volksrod | **ADD MAKE & MODELS** |
| 128 | **CAMPAGNA** | **4** | T-Rex, T-Rex 16S, T-Rex 16SP, V13R | **ADD MAKE & MODELS** |
| 129 | **CENNTRO** | **4** | Logistar 100, Logistar 200, Logistar 260, Metro | **ADD MAKE & MODELS** |
| 130 | **CISITALIA** | **4** | 202 SC, 204, Abarth 204A, Colombo | **ADD MAKE & MODELS** |
| 131 | **CLENET** | **4** | Series I, Series II, Series III, Series IV | **ADD MAKE & MODELS** |
| 132 | **CROSSLE** | **4** | 16F, 7S, 90F, 9S | **ADD MAKE & MODELS** |
| 133 | **DARRACQ** | **4** | 15HP, 20HP, Flying 12, V8 Record | **ADD MAKE & MODELS** |
| 134 | **DETROIT ELECTRIC** | **4** | Brougham, Model 47, Model 75, Model 95 | **ADD MAKE & MODELS** |
| 135 | **DEVINCI** | **4** | Brigitte, DB 718, DB 721, Lucie | **ADD MAKE & MODELS** |
| 136 | **DR** | **4** | MOTOR dr cityCROSS, MOTOR dr1, MOTOR dr2, MOTOR dr5 | **ADD MAKE & MODELS** |
| 137 | **DURANT** | **4** | Model A-22, Rugby, Six, Star | **ADD MAKE & MODELS** |
| 138 | **E.GO** | **4** | Life 20, Life 40, Life 60, e.wave X | **ADD MAKE & MODELS** |
| 139 | **ESSEX** | **4** | Challenger, Coach, Super Six, Terraplane | **ADD MAKE & MODELS** |
| 140 | **Felber** | **4** | Autoroller, Excellence, FF (Ferrari 330), Lancia Fulvia Spider | **ADD MAKE & MODELS** |
| 141 | **FULDAMOBIL** | **4** | Autolette, N-2, S-1, S-6 | **ADD MAKE & MODELS** |
| 142 | **GMA** | **4** | T.33, T.33 Spider, T.50, T.50s Niki Lauda | **ADD MAKE & MODELS** |
| 143 | **GREAT WALL** | **4** | Poer, Steed, Voleex C30, Wingle | **ADD MAKE & MODELS** |
| 144 | **HRG** | **4** | 1100, 1500, Aerodynamic, Twin Cam | **ADD MAKE & MODELS** |
| 145 | **HUPMOBILE** | **4** | Aerodynamic, Model 20, Model 32, Skylark | **ADD MAKE & MODELS** |
| 146 | **IRMSCHER** | **4** | 7 (Seven), Inspiro, Selectra, iS3 | **ADD MAKE & MODELS** |
| 147 | **JETOUR** | **4** | Dashing, T2, X70, X90 | **ADD MAKE & MODELS** |
| 148 | **LEA-FRANCIS** | **4** | 14hp Sport, 2.5 Litre Sports, Ace of Spades, Hyper | **ADD MAKE & MODELS** |
| 149 | **LE ZEBRE** | **4** | Type A, Type B, Type C, Type D | **ADD MAKE & MODELS** |
| 150 | **LLOYD** | **4** | Alexander (TS), Arabella, LP 300, LP 400 | **ADD MAKE & MODELS** |
| 151 | **LTI** | **4** | Fairway, TX1, TX2, TX4 | **ADD MAKE & MODELS** |
| 152 | **MALLOCK** | **4** | Mk11, Mk20, Mk6, U2 Mk2 | **ADD MAKE & MODELS** |
| 153 | **MATHIS** | **4** | Emyquatre, Type P, Type SB, Type TY | **ADD MAKE & MODELS** |
| 154 | **MINERVA** | **4** | Type AB, Type AF, Type AL, Type TT | **ADD MAKE & MODELS** |
| 155 | **MOSKWITSCH** | **4** | 2140, 408, 412, Aleko (2141) | **ADD MAKE & MODELS** |
| 156 | **MOWAG** | **4** | Duro, Eagle, Piranha, T1 | **ADD MAKE & MODELS** |
| 157 | **No (ADD make)** | **4** | Buggy, Francorchamps, Horizon, Speedster | **ADD MAKE & MODELS** |
| 158 | **NORMA** | **4** | M20, M20 F, M20 FC, M30 LMP3 | **ADD MAKE & MODELS** |
| 159 | **OM** | **4** | 469, 665 Superba, Leoncino, Tigrotto | **ADD MAKE & MODELS** |
| 160 | **OMODA** | **4** | 5, 7, 9, E5 | **ADD MAKE & MODELS** |
| 161 | **PANHARD** | **4** | 24 BT, 24 CT, Dyna Z, PL 17 | **ADD MAKE & MODELS** |
| 162 | **PININFARINA** | **4** | B95, B95 Hyper Barchetta, Battista, Spidereuropa (Fiat 124) | **ADD MAKE & MODELS** |
| 163 | **SECMA** | **4** | F16, F16 Turbo, Fun Buggy, Fun Extre'm | **ADD MAKE & MODELS** |
| 164 | **SIATA** | **4** | 208 CS, Amica, Daina, Spring 850 | **ADD MAKE & MODELS** |
| 165 | **SOKON** | **4** | DFSK Fengon, Glory 580, K01, V21 | **ADD MAKE & MODELS** |
| 166 | **SYLVA** | **4** | Fury, Jester, Phoenix, Striker | **ADD MAKE & MODELS** |
| 167 | **TATUUS** | **4** | Formula 4 T-014, Formula Abarth, Formula Renault 2.0, T-318 | **ADD MAKE & MODELS** |
| 168 | **TRABANT** | **4** | 1.1, 601, P50, Tramp | **ADD MAKE & MODELS** |
| 169 | **TRIDENT** | **4** | Clipper, Iceni, Typhoon, Venturer | **ADD MAKE & MODELS** |
| 170 | **UAZ** | **4** | 452, 469, Hunter, Patriot | **ADD MAKE & MODELS** |
| 171 | **YES!** | **4** | Club Sport, Roadster, Roadster 3.2, Roadster 3.2 Turbo | **ADD MAKE & MODELS** |
| 172 | **AC** | **3** | Ace, Aceca, Frua | **ADD MAKE & MODELS** |
| 173 | **ATS** | **3** | 2500 GT, Corsa, GT | **ADD MAKE & MODELS** |
| 174 | **BINZ** | **3** | E-Class Estate XL, E-Class Limousine, XTEND | **ADD MAKE & MODELS** |
| 175 | **BITTER** | **3** | CD, SC, Type 3 | **ADD MAKE & MODELS** |
| 176 | **BIZZARRINI** | **3** | 1900 GT, 5300 GT, P538 | **ADD MAKE & MODELS** |
| 177 | **BONNET** | **3** | Djet, Le Mans, Missile | **ADD MAKE & MODELS** |
| 178 | **BRASIER** | **3** | 16HP, Course, Torpedo | **ADD MAKE & MODELS** |
| 179 | **CITYEL** | **3** | CityEl Basic, CityEl Fun, CityEl Targa | **ADD MAKE & MODELS** |
| 180 | **CLEMENT** | **3** | 14HP, Bayard, Torpedo | **ADD MAKE & MODELS** |
| 181 | **DAREN** | **3** | Mk2, Mk3, Mk6 | **ADD MAKE & MODELS** |
| 182 | **DAX** | **3** | Cobra 427 Replica, De Dion, Rush | **ADD MAKE & MODELS** |
| 183 | **DELAUGERE & CLAYETTE** | **3** | 16HP, 24HP, Torpedo Grand Tourisme | **ADD MAKE & MODELS** |
| 184 | **DFM** | **3** | Fengshen AX7, Glory 580, Rich 6 | **ADD MAKE & MODELS** |
| 185 | **DONNET** | **3** | CI-7, G2, Zedel | **ADD MAKE & MODELS** |
| 186 | **EHP** | **3** | Grand Prix 1100, Type 4, Type 5 | **ADD MAKE & MODELS** |
| 187 | **ERAD** | **3** | Agora, Junior, Spacia | **ADD MAKE & MODELS** |
| 188 | **ESTRIMA** | **3** | Birò Big, Birò Small, Birò Winter | **ADD MAKE & MODELS** |
| 189 | **FOTON** | **3** | Sauvana, Tunland, View | **ADD MAKE & MODELS** |
| 190 | **FRAMO** | **3** | V 501, V 901, V 901/2 | **ADD MAKE & MODELS** |
| 191 | **FULU** | **3** | City EV, Lion EV, Meteor | **ADD MAKE & MODELS** |
| 192 | **FUNYO** | **3** | F4, F5, SP05 | **ADD MAKE & MODELS** |
| 193 | **GAC GONOW** | **3** | GA200, Star, Way | **ADD MAKE & MODELS** |
| 194 | **GAZ** | **3** | Gazelle, Sobol, Volga | **ADD MAKE & MODELS** |
| 195 | **GEORGES** | **3** | Irat AFA, Irat OLC, MDS | **ADD MAKE & MODELS** |
| 196 | **GHIA** | **3** | 1500 GT, 450 SS, L6.4 | **ADD MAKE & MODELS** |
| 197 | **GIBBS** | **3** | Aquada, Humdinga, Quadski | **ADD MAKE & MODELS** |
| 198 | **Gilbern** | **3** | GT, Genie, Invader (Mk I, Mk II, Mk III) | **ADD MAKE & MODELS** |
| 199 | **HANROAD** | **3** | Trek 4, Trek 5, Trek 5+ | **ADD MAKE & MODELS** |
| 200 | **HEINKEL** | **3** | Kabine (Typ 153), Kabine (Typ 154), Tourist | **ADD MAKE & MODELS** |
| 201 | **HINDUSTAN** | **3** | Ambassador, Pushpak/Trekker, RTV/Ranger | **ADD MAKE & MODELS** |
| 202 | **HWM** | **3** | Alta, Formula 2, Stovebolt Special | **ADD MAKE & MODELS** |
| 203 | **IMPERIA** | **3** | GP Hybrid, Nessus, TA-8 | **ADD MAKE & MODELS** |
| 204 | **INVICTA** | **3** | 4 1/2 Litre, Black Prince, S-Type (Low Chassis) | **ADD MAKE & MODELS** |
| 205 | **JORDAN** | **3** | Blue Boy, Playboy, Speedboy | **ADD MAKE & MODELS** |
| 206 | **JOWETT** | **3** | Bradford, Javelin, Jupiter | **ADD MAKE & MODELS** |
| 207 | **KARMANN** | **3** | GF Buggy, Ghia (Typ 14), Ghia (Typ 34) | **ADD MAKE & MODELS** |
| 208 | **LEYLAND** | **3** | Mini, Princess, Sherpa | **ADD MAKE & MODELS** |
| 209 | **LOMBARDI** | **3** | FL1, Grand Prix (Fiat 850), Monza | **ADD MAKE & MODELS** |
| 210 | **LUQI** | **3** | EV300, M1, M2 | **ADD MAKE & MODELS** |
| 211 | **MAXIMAG** | **3** | Grand Sport, Type A, Type B | **ADD MAKE & MODELS** |
| 212 | **MESSERSCHMITT** | **3** | KR175, KR200, Tg500 | **ADD MAKE & MODELS** |
| 213 | **MEV HUMMER** | **3** | HX, HX-T, MEV City | **ADD MAKE & MODELS** |
| 214 | **MIA** | **3** | Mia Box Van, Mia Electric, Mia L | **ADD MAKE & MODELS** |
| 215 | **MORS** | **3** | 16HP, Grand Prix, Torpedo | **ADD MAKE & MODELS** |
| 216 | **OAKLAND** | **3** | Model 32, Model 40, Sensible Six | **ADD MAKE & MODELS** |
| 217 | **OVERLAND** | **3** | Model 79, Model 83, Whippet | **ADD MAKE & MODELS** |
| 218 | **PUMA** | **3** | GT, GTE, GTS | **ADD MAKE & MODELS** |
| 219 | **Rally** | **3** | ABC, Grand Sport, NC | **ADD MAKE & MODELS** |
| 220 | **RUSKA** | **3** | Buggy, Classica, Regina | **ADD MAKE & MODELS** |
| 221 | **SABRA** | **3** | Carmel, Sport GT, Sussita | **ADD MAKE & MODELS** |
| 222 | **SAKER** | **3** | GT, Rapx, Sniper | **ADD MAKE & MODELS** |
| 223 | **SAPOROSHEZ** | **3** | SAS-965, SAS-966, SAS-968 | **ADD MAKE & MODELS** |
| 224 | **SWM-AUTO** | **3** | G01, G05 Pro, Tiger | **ADD MAKE & MODELS** |
| 225 | **TECNO** | **3** | Formula 2, Formula 3, PA123 | **ADD MAKE & MODELS** |
| 226 | **THINK** | **3** | City, City 2-Seater, City 4-Seater | **ADD MAKE & MODELS** |
| 227 | **UMM** | **3** | Alter, Alter II, Cournil | **ADD MAKE & MODELS** |
| 228 | **WELTMEISTER** | **3** | E5, EX5, W6 | **ADD MAKE & MODELS** |
| 229 | **Zenos** | **3** | E10, E10 R, E10 S | **ADD MAKE & MODELS** |
| 230 | **AESTEC** | **2** | GTS, Prototype | **ADD MAKE & MODELS** |
| 231 | **AGM** | **2** | Fox, WLR | **ADD MAKE & MODELS** |
| 232 | **AMERICAN LAFRANCE** | **2** | ALF EAGLE, CONDOR | **ADD MAKE & MODELS** |
| 233 | **ARIEL** | **2** | Atom, Nomad | **ADD MAKE & MODELS** |
| 234 | **ARTEGA** | **2** | GT, Scalo | **ADD MAKE & MODELS** |
| 235 | **BOATTAIL** | **2** | Classic Special, Speedster Custom | **ADD MAKE & MODELS** |
| 236 | **CARBODIE** | **2** | FX4 Taxi, Fairway Taxi | **ADD MAKE & MODELS** |
| 237 | **CLASSIC PLUS** | **2** | Cobra 427 Replica, Speedster 356 Replica | **ADD MAKE & MODELS** |
| 238 | **CMC** | **2** | Classic, Custom Roadster | **ADD MAKE & MODELS** |
| 239 | **DALLARA** | **2** | EXP, Stradale | **ADD MAKE & MODELS** |
| 240 | **DeLorean** | **2** | Alpha 5, DMC-12 | **ADD MAKE & MODELS** |
| 241 | **DIAVOLINO** | **2** | Microcar, Spider 250 | **ADD MAKE & MODELS** |
| 242 | **ELV** | **2** | City Van, EV Cargo | **ADD MAKE & MODELS** |
| 243 | **ENZMANN** | **2** | 506 Coupé, 506 Spider | **ADD MAKE & MODELS** |
| 244 | **FREEWIEL** | **2** | Electric 3-Wheeler, Trikke | **ADD MAKE & MODELS** |
| 245 | **GO** | **2** | Electric Microcar, Go-Pod | **ADD MAKE & MODELS** |
| 246 | **JAECOO** | **2** | 7, 8 | **ADD MAKE & MODELS** |
| 247 | **JIAYUAN** | **2** | City Spirit, Komi | **ADD MAKE & MODELS** |
| 248 | **KAMOO** | **2** | City EV, Electric Roadster | **ADD MAKE & MODELS** |
| 249 | **KARMA** | **2** | Revero GT, Revero GTS | **ADD MAKE & MODELS** |
| 250 | **KOUGAR** | **2** | Monza, Sports | **ADD MAKE & MODELS** |
| 251 | **KV** | **2** | KVS, Mini 1 | **ADD MAKE & MODELS** |
| 252 | **LEGENDS CAR** | **2** | Chevrolet 1937 Sedan, Ford 1934 Coupe | **ADD MAKE & MODELS** |
| 253 | **LEVC** | **2** | TX (London Taxi), VN5 (Electric Van) | **ADD MAKE & MODELS** |
| 254 | **LOCOMOBILE** | **2** | Model 48, Model 90 | **ADD MAKE & MODELS** |
| 255 | **MANTA CARS** | **2** | Mirage, Montage | **ADD MAKE & MODELS** |
| 256 | **MARTIN** | **2** | Cobra 427, Tilbury | **ADD MAKE & MODELS** |
| 257 | **MOSLER** | **2** | Consulier GTP, MT900 | **ADD MAKE & MODELS** |
| 258 | **MPM MOTORS** | **2** | Erelis, PS 160 | **ADD MAKE & MODELS** |
| 259 | **MVS** | **2** | Venturi 200, Venturi 260 | **ADD MAKE & MODELS** |
| 260 | **QVALE** | **2** | MANGUSTA, Mangusta | **ADD MAKE & MODELS** |
| 261 | **RCB** | **2** | HS 20, Seven 77 | **ADD MAKE & MODELS** |
| 262 | **RCH-AUTOMOTIVE** | **2** | 356 Speedster Replica, 550 Spyder Replica | **ADD MAKE & MODELS** |
| 263 | **REVA** | **2** | G-Wiz, Reva i | **ADD MAKE & MODELS** |
| 264 | **RIMAC** | **2** | Concept_One, Nevera | **ADD MAKE & MODELS** |
| 265 | **SENECHAL** | **2** | Grand Sport, Sport | **ADD MAKE & MODELS** |
| 266 | **SKYWELL** | **2** | BE11, ET5 | **ADD MAKE & MODELS** |
| 267 | **SPECTRE** | **2** | R42, R45 | **ADD MAKE & MODELS** |
| 268 | **SPIRE** | **2** | GT-3, GT-R | **ADD MAKE & MODELS** |
| 269 | **UMI** | **2** | EV Truck, Transporter | **ADD MAKE & MODELS** |
| 270 | **VOLTEIS** | **2** | V6, X40 | **ADD MAKE & MODELS** |
| 271 | **WARTBURG** | **2** | 1.3, 353 | **ADD MAKE & MODELS** |
| 272 | **XEV** | **2** | Kitty, Yoyo | **ADD MAKE & MODELS** |
| 273 | **ZIMMER** | **2** | Golden Spirit, Quicksilver | **ADD MAKE & MODELS** |
| 274 | **AMPHICAR** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 275 | **BERTONE** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 276 | **CARVER** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 277 | **CROCO** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 278 | **DELARION** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 279 | **DESTINY** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 280 | **ENGIADINA** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 281 | **FORTUNA** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 282 | **HITEC** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 283 | **HS** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 284 | **ICAUR** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 285 | **JIA JI** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 286 | **KLEINSCHNITTGER** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 287 | **LORENZ & RANKL** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 288 | **MINELLI** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 289 | **MLT** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 290 | **NOSMOKE** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 291 | **OBERMAIER** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 292 | **PRC** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 293 | **RAYTON FISSORE** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 294 | **RMB** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 295 | **ROSSION** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 296 | **SAM** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 297 | **SEVENTY SEVEN** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 298 | **SMILE** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 299 | **STEPHENS** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 300 | **SWALLOW** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 301 | **VALE** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 302 | **XIAOMI** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 303 | **ZARP** | **1** | Models in catalog | **ADD MAKE & MODELS** |
| 304 | **ZBR** | **1** | Models in catalog | **ADD MAKE & MODELS** |

### 3.3 All 84 Extra Brands in AutoPlace Database (Not in AutoScout24 Passenger Cars)

These 84 brands are currently present in AutoPlace's database catalog (`tbl_vehicle_catalog_brands`), but do NOT belong to AutoScout24's **Cars** category (they belong to Trucks or MotoScout24):

| # | Brand / Make | AutoPlace Models | Category Classification in Switzerland | Recommended Action |
| :-: | :--- | :---: | :--- | :--- |
| 1 | **Mitsubishi Fuso** | **33** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 2 | **SsangYong** | **13** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 3 | **Ford USA** | **11** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 4 | **KGM** | **10** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 5 | **Dodge USA** | **6** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 6 | **StreetScooter** | **6** | Specialty Commercial EV | Move to Specialty Commercial EV category (keep out of passenger car filter) |
| 7 | **EVI** | **4** | Specialty Commercial EV | Move to Specialty Commercial EV category (keep out of passenger car filter) |
| 8 | **TYN-e** | **4** | Specialty Commercial EV | Move to Specialty Commercial EV category (keep out of passenger car filter) |
| 9 | **Saab-Hirsch** | **3** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 10 | **Chrysler USA** | **1** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 11 | **Dallas** | **1** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 12 | **Subaru USA** | **1** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 13 | **Aeon** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 14 | **Aprilia** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 15 | **Arctic Cat** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 16 | **Barossa** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 17 | **Benelli** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 18 | **Beta** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 19 | **Bimota** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 20 | **Bombardier** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 21 | **Brixton** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 22 | **Buell** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 23 | **Cagiva** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 24 | **CF Moto** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 25 | **Chang Jiang** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 26 | **Cilo** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 27 | **CPI** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 28 | **Daelim** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 29 | **Derbi** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 30 | **Dnepr** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 31 | **Ducati** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 32 | **Egli** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 33 | **ENERGICA** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 34 | **Enfield** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 35 | **Fantic Motor** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 36 | **Gas Gas** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 37 | **Generic** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 38 | **Gilera** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 39 | **Harley-Davidson** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 40 | **Herchee** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 41 | **Husaberg** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 42 | **Husqvarna** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 43 | **Hyosung** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 44 | **Indian** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 45 | **Italjet** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 46 | **Kawasaki** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 47 | **Keeway** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 48 | **KL** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 49 | **Kymco** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 50 | **Lambretta** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 51 | **Laverda** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 52 | **LML** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 53 | **Malaguti** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 54 | **Masai** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 55 | **Mash** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 56 | **MBK** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 57 | **Mondial** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 58 | **Monnier-Honda** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 59 | **Moser-HM** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 60 | **Moto Guzzi** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 61 | **Moto Morini** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 62 | **MOTRON** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 63 | **MUZ** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 64 | **MV Agusta** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 65 | **NIU** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 66 | **Pony** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 67 | **Rieju** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 68 | **Sachs** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 69 | **SMC** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 70 | **SUPER SOCO** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 71 | **SWM** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 72 | **SYM (Sanyang)** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 73 | **TARO** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 74 | **TGB** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 75 | **Tomos** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 76 | **Ural** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 77 | **VICTORY** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 78 | **VOGE** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 79 | **VOR** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 80 | **Voxan** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 81 | **Winking** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 82 | **Wottan** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 83 | **Yamaha** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |
| 84 | **Zontes** | **0** | Motorcycle / Scooter | Move to Motorcycle / Scooter category (keep out of passenger car filter) |

---

## 🚘 4. Car-by-Car Deep Audit: All 31 Active Listings in AutoPlace vs AutoScout24

Below is the complete audit of every single vehicle currently active in AutoPlace (`tbl_cars`), showing how each user-typed model maps to AutoScout24:

| # | AutoPlace Make | As Typed in AutoPlace | Cleaned Model | Extracted Version / Body | Found in AutoScout24? | AutoScout24 Model Name | Recommended Action |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | **Aiways** | `U5` | **U5** | Standard | ✅ **Yes** | `U5` | **KEEP** |
| **2** | **Aiways** | `U6` | **U6** | Standard | ✅ **Yes** | `U6` | **KEEP** |
| **3** | **Aixam** | `100 Avant` | **100 Avant** | Base | ⚠️ **No** | *Aixam has 8 models (City, Crossline, Coupé, etc.)* | **CONFIRM**: Re-map to correct Aixam model or keep as legacy |
| **4** | **Alfa Romeo** | `155` | **155** | Standard | ✅ **Yes** | `155` | **KEEP** |
| **5** | **Alfa Romeo** | `Alfasud` | **Alfasud** | Classic | ✅ **Yes** | `Alfasud` | **KEEP** |
| **6** | **Aston Martin** | `DB12 Coupé` | **DB12** | Body: *Coupé* | ✅ **Yes** | `DB12` | **CHANGE**: Move `Coupé` to Body Type |
| **7** | **Aston Martin** | `Vanquish` | **Vanquish** | Standard | ✅ **Yes** | `Vanquish` | **KEEP** |
| **8** | **Audi** | `A1 Sport` | **A1** | Version: *Sport* | ✅ **Yes** | `A1` | **CHANGE**: Set model `A1`, version `Sport` |
| **9** | **Audi** | `A8` | **A8** | Standard | ✅ **Yes** | `A8` | **KEEP** |
| **10** | **Audi** | `Q4 e-tron` | **Q4 e-tron** | Electric | ✅ **Yes** | `Q4 e-tron` | **KEEP** |
| **11** | **BMW** | `E23` | **7 Series** | Chassis: *E23* | ✅ **Yes** | `7 Series` (728, 730, 735, etc.) | **CHANGE**: Map to `7 Series`, version `E23` |
| **12** | **BMW** | `E32` | **7 Series** | Chassis: *E32* | ✅ **Yes** | `7 Series` (730, 735, 740, 750) | **CHANGE**: Map to `7 Series`, version `E32` |
| **13** | **BMW** | `i7 G70` | **i7** | Chassis: *G70* | ✅ **Yes** | `i7` | **CHANGE**: Set model `i7`, version `G70` |
| **14** | **BMW** | `X5 xDrive40i` | **X5** | Trim: *xDrive40i* | ✅ **Yes** | `X5` | **CHANGE**: Set model `X5`, version `xDrive40i` |
| **15** | **BMW** | `Z4 Z85 Coupé` | **Z4** | Chassis: *Z85*, Body: *Coupé* | ✅ **Yes** | `Z4` | **CHANGE**: Set model `Z4`, version `Z85`, body `Coupé` |
| **16** | **BMW Alpina** | `B12` | **B12** | Classic | ✅ **Yes** | `B12` | **CHANGE**: Update Make spelling to `BMW-ALPINA` |
| **17** | **BYD** | `Han` | **Han** | Electric Flagship | ⚠️ **No** | *Listed in AS24 as `HAN` (all caps) or sub-trim* | **CONFIRM**: Align casing to AutoScout24 format |
| **18** | **Cadillac** | `Lyriq` | **Lyriq** | Electric SUV | ✅ **Yes** | `Lyriq` | **KEEP** |
| **19** | **Ford** | `Mustang Coupé` | **Mustang** | Body: *Coupé* | ✅ **Yes** | `Mustang` | **CHANGE**: Move `Coupé` to Body Type |
| **20** | **Hyundai** | `Santa Fe` | **Santa Fe** | SUV | ✅ **Yes** | `Santa Fe` | **KEEP** |
| **21** | **Kia** | `K4` | **K4** | Sedan | ✅ **Yes** | `K4` | **KEEP** |
| **22** | **Land Rover** | `Defender 110` | **Defender** | Wheelbase: *110* | ✅ **Yes** | `Defender` | **CHANGE**: Set model `Defender`, version `110` |
| **23** | **Land Rover** | `Range Rover Evoque` | **Range Rover Evoque** | Compact SUV | ✅ **Yes** | `Range Rover Evoque` | **KEEP** |
| **24** | **Maserati** | `MCPura Cielo` | **MCPura** | Version: *Cielo* | ✅ **Yes** | `MCPura` / `MC20` | **CHANGE**: Set model `MCPura`, version `Cielo` |
| **25** | **Mercedes-Benz** | `AMG GT C190 Coupé`| **AMG GT** | Chassis: *C190*, Body: *Coupé* | ⚠️ **Special** | `GT AMG` / `AMG GT` | **CONFIRM**: Map to AutoScout24's exact model tag |
| **26** | **MG** | `Cyberster` | **Cyberster** | Electric Roadster | ✅ **Yes** | `Cyberster` | **KEEP** |
| **27** | **Porsche** | `911 Speedster` | **911** | Edition: *Speedster* | ✅ **Yes** | `911` | **CHANGE**: Set model `911`, version `Speedster` |
| **28** | **Rolls Royce** | `Phantom` | **Phantom** | Ultra-Luxury | ✅ **Yes** | `Phantom` | **CHANGE**: Update Make spelling to `ROLLS-ROYCE` |
| **29** | **Toyota** | `Camry` | **Camry** | Sedan | ✅ **Yes** | `Camry` | **KEEP** |
| **30** | **Volvo** | `XC90` | **XC90** | Large SUV | ✅ **Yes** | `XC90` | **KEEP** |
| **31** | **VW** | `Golf VII Variant` | **Golf** | Gen: *VII*, Body: *Variant* | ✅ **Yes** | `Golf` | **CHANGE**: Set model `Golf`, version `VII Variant` |

---

## 🛠️ 5. Actionable Alignment Matrix: ADD, CHANGE, REMOVE, KEEP

### 1. What to ADD (Missing in AutoPlace)
1. **304 Missing Makes**: Insert all 304 missing AutoScout24 makes into `tbl_vehicle_catalog_brands` (e.g. Acura, Bugatti, Genesis, McLaren, Lincoln, Pontiac, Austin, Rover, etc.).
2. **5,932 Official Swiss Models**: Seed the official AutoScout24 models for each of the 408 makes into `tbl_vehicle_catalog_models`.
3. **Multi-Model Selection**: Allow users to tick multiple models simultaneously (e.g., Audi A4 + A6).
4. **"Exclude Model" Feature**: A checkbox next to selected makes allowing users to exclude specific models.
5. **Dedicated "Add Version" Text Filter**: Free-text search box for trims (`GTI`, `AMG`, `M Sport`, `Quattro`, `4Matic`, `RS`, `Turbo`).
6. **3 Missing Body Types**: `Compact car` (Kleinwagen), `Pick-up`, and `Minivan`.
7. **Top Vehicle Category Tabs**: Add 5 tabs: `Campers`, `Utility`, `Trucks`, `Trailers`, `Motorcycles`.
8. **100 Standard Equipment Checkboxes**: Standard automotive options catalog (Navigation, Sunroof, Leather, Heated seats, 360° Cam, Matrix LED, Towbar, Apple CarPlay / Android Auto, Isofix).
9. **EV Battery Health (SoH %)**: Battery certificate checkbox and State of Health range slider (10%–100%).

### 2. What to CHANGE (Adjust in AutoPlace)
1. **Make Names Spelling**:
   * Change `Rolls Royce` $\longrightarrow$ `ROLLS-ROYCE`.
   * Change `BMW Alpina` $\longrightarrow$ `BMW-ALPINA`.
2. **Model Clean-Up**:
   * Separate trim and body names out of model names (e.g., change `A1 Sport` to Model `A1` and Version `Sport`).
3. **Body Type Naming**:
   * Change `Saloon` $\longrightarrow$ `Sedan`.
   * Change `Estate car` $\longrightarrow$ `Station wagon` (Kombi).
   * Change `Convertible` $\longrightarrow$ `Cabriolet`.
4. **Fuel Type Grouping & Database Bug Fix**:
   * Fix `tbl_fuel_types` ID 2: change code from `Petrol cat.` to `diesel`.
   * Fix `tbl_fuel_types` ID 3: change code from `Diesel` to `electric`.
   * Group all 14 fuels into AutoScout24's 5 collapsible categories (*Petrol, Diesel, Hybrid [6 sub-types], Electric, Gas [CNG/LPG], Other*).
5. **Transmission Grouping**:
   * Group `CVT`, `AMT`, `Automatic`, and `Semi-automatic` under parent group **`Automatic transmission`**.
6. **Condition Alignment**:
   * Merge `Occasion - Very good` and `Occasion - Good` into single standard: **`Used` (Occasion)**.

### 3. What to REMOVE (Eliminate / Merge)
1. **Sports car (`tbl_body_types` ID 8)**: AutoScout24 classifies sports cars under Coupé or Cabriolet; remove as a standalone body type.
2. **Duplicate All-Wheel Drive (`tbl_drives` ID 3 & ID 5)**: Merge duplicate `4x4 -wheel` and `All-wheel` into single standard `All-wheel (4x4)`.
3. **Duplicate Tires Extra (`extras_options` ID 4)**: Remove `two_sets_of_tires` in favor of standard `eight_tyres` (`8 Tyres`).
4. **Soft-Deleted Test Seal (`tbl_quality_seals` ID 2)**: Remove test entry from database.
5. **CH Car from MFK Filter**: Remove `ch_car` from the inspection dropdown; keep it strictly as the Swiss Vehicle filter checkbox.

### 4. What to KEEP (Already Matching)
1. **19 Exterior & Interior Colors**: Exact match with AutoScout24 colors and hex codes.
2. **Swiss Energy Label**: Standard `A`, `B`, `C`, `D`, `E`, `F`, `G` rating system.
3. **Core Technical Range Filters**: Purchase Price (CHF), Leasing Rate (CHF), Year, Kilometers, Engine Power (PS/kW dual unit), Displacement (cm³), Cylinders, Seats, Doors, Towing Capacity (kg).
4. **Accident Status**: Binary damaged vs accident-free logic.

---

## ❓ 6. Client Decisions Required (Sign-Off Checklist)

Before backend and UI changes are implemented, client confirmation is required on the following points:

1. **Catalog Adoption**:
   * Confirm importing AutoScout24's full **408 Makes and 5,932 Models** into AutoPlace's master catalog so both platforms are 100% synchronized.
2. **Category Separation**:
   * Confirm separating the 5,451 commercial utility models (Iveco, Ducato, Sprinter, Transit) into a dedicated "Utility" category tab, leaving the "Cars" filter clean like AutoScout24.
3. **Free-Text vs Catalog Picker**:
   * Confirm making the car upload form strictly pick from the catalog, preventing sellers from typing custom typos.
4. **Casing & Spelling Alignment**:
   * Confirm standardizing all brand and model spellings to the Swiss market standard.

---
*Exhaustive master comparison document generated from live AutoPlace database catalog and AutoScout24 Swiss Master Catalogue.*
