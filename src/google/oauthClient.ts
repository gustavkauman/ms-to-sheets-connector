import * as fs from "fs/promises";
import * as path from "path";
import { OAuth2Client, auth } from "google-auth-library";

const AUTH_CODE_PATH = path.join(process.cwd(), 'code.txt');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const SCOPES: string[] = ['https://www.googleapis.com/auth/spreadsheets'];

async function loadSavedCredentials(): Promise<any | null> {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content.toString());
        const client = auth.fromJSON(credentials);
        return client;
    } catch (err) {
        return null;
    }
}

async function saveCredentials(client: OAuth2Client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content.toString());
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function getToken(client: OAuth2Client) {
    try {
        await client.getAccessToken();
    } catch(err) {
        client.on('tokens', (tokens) => {
            if (tokens.refresh_token)
                console.log(tokens.refresh_token);
            console.log(tokens.access_token);
        });

        const authCode = await fs.readFile(AUTH_CODE_PATH);
        const r = await client.getToken(authCode.toString());
        client.setCredentials(r.tokens);
        await saveCredentials(client);
    }
}

async function testConnection() {
    const client = await getOAuthClient();
    await getToken(client);
    console.log("Connection OK");
}

async function getConsentUrl(): Promise<string> {
    return (await getOAuthClient()).generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'select_account consent'
    });
}

async function getOAuthClient(): Promise<OAuth2Client> {
    let client = await loadSavedCredentials();
    if (client) {
        return client;
    }

    const keys = require(CREDENTIALS_PATH);
    client = new OAuth2Client(
        keys.installed.client_id,
        keys.installed.client_secret,
        keys.installed.redirect_uris[0]
    );

    return client;
}

async function setAuthCode(newCode: string) {
    await fs.writeFile(AUTH_CODE_PATH, newCode);
}

export { getConsentUrl, setAuthCode, testConnection, getOAuthClient };
