import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { getCarDetailsForPdf } from '../../services/carDetails.service.js';

export const downloadCarPdf = async (req, res) => {
    let browser;
    try {
        const { id } = req.params;

        // 1️⃣ fetch data from service
        const carData = await getCarDetailsForPdf(id);

        if (!carData) {
            return res.status(404).json({ message: "Car not found" });
        }

        // 2️⃣ read template
        const templatePath = path.join(process.cwd(), "templates/car_details.hbs");
        const templateHtml = await fs.readFile(templatePath, "utf8");

        // ✅ 3️⃣ handlebars compile
        const template = handlebars.compile(templateHtml);

        // ✅ 4️⃣ inject full data object
        const finalHtml = template(carData);

        // 5️⃣ launch puppeteer
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        const pdfTimeout = 120000;
        page.setDefaultNavigationTimeout(pdfTimeout);
        page.setDefaultTimeout(pdfTimeout);

        // ✅ IMPORTANT → finalHtml
        await page.setContent(finalHtml, {
            waitUntil: "domcontentloaded",
            timeout: pdfTimeout
        });

        await page.evaluate(async () => {
            const waitForImage = (img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    const done = () => resolve();
                    img.addEventListener("load", done, { once: true });
                    img.addEventListener("error", done, { once: true });
                });
            };
            const images = Array.from(document.images || []);
            await Promise.race([
                Promise.all(images.map(waitForImage)),
                new Promise((resolve) => setTimeout(resolve, 10000))
            ]);
        });

        // 6️⃣ generate pdf
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();
        browser = null;

        // 7️⃣ send response as strict binary buffer
        const fileBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        res.status(200);
        const fileName = `car-${id}.pdf`;
        res.type("pdf");
        res.attachment(fileName);
        res.setHeader("Content-Length", String(fileBuffer.length));
        res.setHeader("Cache-Control", "no-store");

        return res.end(fileBuffer);

    } catch (error) {
        console.error("PDF Error:", error);
        return res.status(500).json({ message: "PDF generation failed" });
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error("PDF browser close error:", closeError);
            }
        }
    }
};

// code by raj year range filter
