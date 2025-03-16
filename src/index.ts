import {Subscriber} from "zeromq";
import {TopicCheckerResult, ZMQSubCheckerBinder} from "./ZMQSubCheckerBinder";
import {LogConclusionAsMarkDown} from "./LogConclusionAsMarkDown";

const checkIdentifierFormat = (message: any): TopicCheckerResult => {
    const idPattern = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;

    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const messageKeysLength = Object.keys(message).length

    for (const key in message) {
        if (!idPattern.test(key)) {
            result.isOk = false;
            result.feedback.push(`key: ${key} voldoet niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane`);
        }
    }

    if (result.feedback.length > messageKeysLength/2) {
        result.feedback = ["De meeste keys voldoen niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane."];
    }
    return result;
}

const checkValidValues = (message: { [key: string]: "rood" | "groen" | "oranje" }): TopicCheckerResult => {
    const validStates = ["groen", "oranje", "rood"];
    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const messageKeyLength = Object.keys(message).length;
    for (const key in message) {
        const value = message[key];
        const pass = validStates.includes(value);
        if (!pass) {
            result.isOk = false;
            result.feedback.push(`Key: ${key} Value: ${value} is niet één van ["rood", "oranje", "groen"]. Check voor spelfouten en NL/EN.`)
        }
    }

    if (result.feedback.length > (messageKeyLength / 2)) {
        result.feedback = ['De meeste values zijn niet één van ["rood", "oranje", "groen"].']
    }

    if (result.feedback.length > messageKeyLength) {
        result.feedback = ['De values voldoen niet aan de requirement: ["rood", "oranje", "groen"].']
    }

    return result;
}

async function run() {
    const sub = new Subscriber();
    sub.connect("tcp://127.0.0.1:5556");

    const binder = new ZMQSubCheckerBinder(sub);

    binder.bind("stoplichten", {
        checksFor: "protocol",
        method: checkIdentifierFormat
    });

    binder.bind("stoplichten", {
        checksFor: "protocol",
        method: checkValidValues,
    });

    await binder.run({
        resultOutput: LogConclusionAsMarkDown
    });
}

run().then(() => console.log("done"));
