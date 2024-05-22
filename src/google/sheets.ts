import { google } from "googleapis";
import { getOAuthClient } from "./oauthClient";

async function getValuesFromSheet(spreadsheetId: string, sheetName: string): Promise<string[][] | null | undefined> {
    const sheets = google.sheets({ version: 'v4', auth: (await getOAuthClient() as any) });

    const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1000`,
    });

    return readRes.data.values;
}

async function addValuesToSheet(spreadsheetId: string, sheetName: string, values: string[][]) {
    if (values.length <= 0) return;

    const sheets = google.sheets({ version: 'v4', auth: (await getOAuthClient() as any) });

    const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:A1000`,
    });
    const lastRow = readRes.data.values?.length || 0;

    const numberOfValues = values[0]?.length; 

    // Assuming that ALL values have the same amount
    const range = `${sheetName}!A${lastRow + 1}:${convertNumberToSheetColumn(numberOfValues)}${lastRow + 1}`;

    const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: `RAW`,
        insertDataOption: `INSERT_ROWS`,
        requestBody: {
            values
        }
    });

    if (res.status >= 400)
        throw new Error("Failed to update values");
}

function convertNumberToSheetColumn(value: number): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";

    if (value > alphabet.length) {
        result += alphabet.charAt(value - alphabet.length - 1);
        value = value - alphabet.length;
    }
    
    if (value > alphabet.length * 2)
        throw new Error("Yeeeezzzz, too many questions to handle the columns!");

    result += alphabet.charAt(value - 1);

    return result;
}

export { getValuesFromSheet, addValuesToSheet };
