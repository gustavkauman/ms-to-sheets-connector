import Odoots from "odoots";
import * as dotenv from "dotenv";

const odoo = new Odoots("https://medlem.dds.dk", "dds");

let authenticated = false;

async function getEventResponses(eventId: number, fromRegistrationId: number = 0): Promise<string[][]> {
    await ensureAuthenticated();

    const eventRegistrations = await odoo.call(
        "event.registration",
        "search_read",
        [
            [
                ["event_id", "=", eventId],
                ["id", ">", fromRegistrationId]
            ],
            [
                "id"
            ]
        ],
        { limit: 10, order: "id" }
    );

    const map = await Promise.all(eventRegistrations.map(async (eventRegistration: any): Promise<any> => {
        const questionResponses = await odoo.call(
            "event.question.response",
            "search_read",
            [
                [
                    ["event_registration_id", "=", eventRegistration.id]
                ],
                [
                    "event_registration_id",
                    "event_question_id",
                    "event_question_option_id",
                    "response_format",
                    "question_type"
                ]
            ]
        );

        const res = questionResponses.map((response: any) => { 
            switch (response.question_type) {
                case 'text':
                case 'email':
                case 'date':
                    return response.response_format;
                default:
                    return response.event_question_option_id[1];
            }
        });

        return [ eventRegistration.id, ...res ];
    }));

    return map;
}

async function printAllEvents() {
    await ensureAuthenticated();

    const events = await odoo.call(
        "event.event",
        "search_read",
        [
            [
            ],
            [
                "id",
                "name"
            ]
        ]
    );

    console.log(events);
}

async function ensureAuthenticated() {
    if (authenticated)
        return;

    dotenv.config();
    
    const username = process.env.MS_USERNAME ?? "";
    const password = process.env.MS_PASSWORD ?? "";

    await odoo.login(username, password);
    authenticated = true;
}

export { printAllEvents, getEventResponses };
