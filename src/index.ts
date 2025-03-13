import {Subscriber} from "zeromq";
import {ZMQSubCheckerBinder} from "./ZMQSubCheckerBinder";


// 3. Check that the identifier is in the proper "g.l" format.
// Adjust the regex as needed if letters and/or numbers are allowed.
function checkIdentifierFormat(message: any): boolean {
    if (!message) return false;
    const idPattern = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;

    for (const key in message) {
        if (!idPattern.test(key)) {
            console.error(`checkIdentifierFormat: key: ${key} does not match the 'g.l' format`);
        } else {
            console.log(`checkIdentifierFormat: key: ${key} DOES match the 'g.l' format`);
        }
    }


    return true;
}

// 4. Check that the traffic light state is one of the allowed values.
function checkValidState(message: any): boolean {
    if (!message) return false;
    const validStates = ["groen", "oranje", "rood"];
    for (const key in message) {
        const pass = validStates.includes(message[key]);
        if (!pass) {return false}
    }
    return true;
}


async function run() {
    const sub = new Subscriber();
    sub.connect("tcp://127.0.0.1:5556");

    const binder = new ZMQSubCheckerBinder(sub);

    binder.bind("stoplichten", {
        checker: checkIdentifierFormat,
        name: "Identifier Format Check"
    });

    binder.bind("stoplichten", {
        checker: checkValidState,
        name: "Valid State Check"
    });

    await binder.run();
}

run().then(() => console.log("done"));
