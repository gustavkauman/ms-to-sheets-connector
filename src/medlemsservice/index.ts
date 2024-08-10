import Odoots from "odoots";
import * as dotenv from "dotenv";

const odoo = new Odoots("https://medlem.dds.dk", "dds");

let authenticated = false;

async function getEventResponses(eventId: number, fromRegistrationId: number = 0): Promise<string[][]> {
    await ensureAuthenticated();

    const eventQuestions = await odoo.call(
        "event.question",
        "search_read",
        [
            [
                ["event_id", "=", eventId],
                ["hidden", "<>", "true"]
            ],
            [
            ]
        ]
    );

    const eventRegistrations = await odoo.call(
        "event.registration",
        "search_read",
        [
            [
                ["event_id", "=", eventId],
                ["id", ">", fromRegistrationId],
                ["state", "<>", "draft"]
            ],
            [
                "id"
                , "name"
                , "phone"
                , "email"
            ]
        ],
        { limit: 10, order: "id" }
    );

    const map = await Promise.all(eventRegistrations.map(async (eventRegistration: any): Promise<any> => {
        const questionResponses: { [k: string]: any } = {};

        (await odoo.call(
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
        )).forEach((response: any) => {
            let key = "";

            if (response.question_type === "checkbox") {
                key = `${response.event_question_id[0]}+${response.event_question_option_id[0]}`;
            } else {
                key = response.event_question_id[0];
            }

            questionResponses[key] = response;
        });

        let res: any[] = [];

        eventQuestions.forEach((val: any) => {
            if (val.question_type === "checkbox") {
                // Checkbox questions has the funny quirk that each checkbox is
                // registered as an individual response.
                val.event_question_option_ids.forEach((option: any) => {
                    let answer = questionResponses[`${val.id}+${option}`];

                    (answer)
                        // ? res.push(answer.event_question_option_id[1].trim())
                        ? res.push('x')
                        : res.push('');
                });
            } else {
                let answer = questionResponses[`${val.id}`];

                switch (answer.question_type) {
                    case 'text':
                    case 'email':
                    case 'date':
                        res.push(answer.response_format.trim());
                        break;
                    default:
                        res.push(answer.event_question_option_id[1].trim());
                        break;
                }
            }
        });

        return [
            eventRegistration.id,
            eventRegistration.name,
            eventRegistration.email,
            eventRegistration.phone,
            ...res
        ];
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
