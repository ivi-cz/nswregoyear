const puppeteer = require('puppeteer');
const express = require('express');

const app = express();

const rego_check_url = 'https://my.service.nsw.gov.au/MyServiceNSW/index#/rms/freeRegoCheck/details';
const invalid_rego = 'The details you entered do not match our records. Please check and try again. Need help? Call us on 13 77 88.';
const xpath = '/html/body/div[3]/div/div/div/div/div/div[2]/free-rego-check-display/div[2]/div/snsw-vehicle-details/div/div/div[1]/div/div[2]/small[2]';

app.get('/', async (req, res) => {
    const { rego } = req.query;

    if (rego.length > 6) {
        return res.status(403).send('Registration must include a maximum of 6 characters.');
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.goto(rego_check_url);
        await page.type('input[name=formly_2_input_plateNumber_0]', rego);
        await page.click('input[name=formly_2_checkbox-label-with-action_termsAndConditions_1]');
        await page.keyboard.press('Enter');
        await page.waitForNetworkIdle();

        // Find the element using XPath
        const elements = await page.$x(xpath);
        if (elements.length === 0) {
            return res.status(404).send('Vehicle information not found.');
        }

        const vehicleInfo = await page.evaluate(element => element.textContent, elements[0]);

        // Extracting the first four characters (assuming they are the year)
        const year = vehicleInfo.substring(0, 4);
        
        res.status(200).send({ year });
    } catch (error) {
        res.status(500).send(`Error during request processing: ${error.message}`);
    } finally {
        await browser.close();
    }
});

app.listen(8000, () => {
    console.clear();
    console.log('Listening on port 8000.');
});
