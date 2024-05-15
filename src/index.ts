import { getConsentUrl, setAuthCode, testConnection } from "./google/oauthClient";
import { addValuesToSheet, getValuesFromSheet } from "./google/sheets";
import { getEventResponses, printAllEvents } from "./medlemsservice";
import * as dotenv from "dotenv";

dotenv.config();

const SHEET_ID = process.env.SHEET_ID ?? "";
const SHEET_NAME = process.env.SHEET_NAME ?? "";

async function handle() {
    switch (process.argv[2].toLowerCase()) {
        case 'events': {
            await printAllEvents();
            return;
        }
        case 'responses': {
            console.log(await getEventResponses(parseInt(process.argv[3], 10)));
            return;
        }
        case 'get-url': {
            console.log(await getConsentUrl());
            return;
        }
        case 'set-code': {
            await setAuthCode(process.argv[3]);
            return;
        }
        case 'test-connection': {
            await testConnection();
            return;
        }
        case 'copy-responses': {
            const existingValues = await getValuesFromSheet(SHEET_ID, SHEET_NAME);

            let lastId = 0;
            if (existingValues && existingValues.length > 0) {
                const lastRow = existingValues[existingValues.length - 1];
                lastId = parseInt(lastRow[0]) || 0;
            }

            const responses = await getEventResponses(parseInt(process.argv[3], 10), lastId);
            await addValuesToSheet(SHEET_ID, SHEET_NAME, responses);

            return;
        }
        default: {
            console.log("Currently handled subcommands:\nevents\nresponses\nget-url\nset-code\ntest-connection\ncopy-responses");
            return;
        }
    }
}

handle();
