import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {TrafficData} from "../Data/TrafficData";

const identiteitFormaat = (message: any): TopicCheckerResult => {
    const idPattern = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;

    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const messageKeysLength = Object.keys(message).length

    for (const key in message) {
        if (!idPattern.test(key)) {
            result.isOk = false;
            result.feedback.push(`key: ${key} voldoet niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane`);
        }
    }

    if (result.feedback.length > messageKeysLength / 2) {
        result.feedback = ["De meeste keys voldoen niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane."];
    }
    return result;
}

const valideWaardes = (message: { [key: string]: "rood" | "groen" | "oranje" }): TopicCheckerResult => {
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

const useIdentiteitIsErkend = (trafficData: TrafficData) => {
    const identiteitIsErkend = (message: { [key: string]: "rood" | "groen" | "oranje" }): TopicCheckerResult => {
        let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

        const messageKeyLength = Object.keys(message).length;
        const acknowledgedTrafficLightKeys = Object.keys(trafficData.groups) // todo: omzetten naar valide stoplicht ids: `g.l` inpv `g`
        for (const key in message) {
            if (acknowledgedTrafficLightKeys.includes(key)) {
                console.log(key, acknowledgedTrafficLightKeys)
                result.isOk = false;
                result.feedback.push(`Key: ${key} wordt niet erkend als een bestaand stoplicht volgens het protocol.`)
            }
        }
        if (result.feedback.length > messageKeyLength / 2) {
            result.feedback = ["De meeste meegegeven keys worden niet erkend als bestaande stoplichten volgens het protocol."]
        }
        if (result.feedback.length == messageKeyLength) {
            result.feedback = ["Geen één van de meegegeven keys wordt erkend als een bestaand stoplicht volgens het protocol"]
        }
        return result
    }
    return identiteitIsErkend
}


export const bindStoplichtTopicProtocol = (binder: ZMQSubCheckerBinder, trafficData: TrafficData): ZMQSubCheckerBinder => {
    binder.bind("stoplichten", {
        checksFor: "protocol",
        description: "Controleert of alle keys in hetzelfde formaat zijn als een stoplicht id. Zoals beschreven in de spec. `g.l`",
        method: identiteitFormaat
    });

    binder.bind("stoplichten", {
        checksFor: "protocol",
        description: 'Controleert of alle waardes van de message binnen de mogelijk waardes valt: ["rood", "oranje", "groen"]',
        method: valideWaardes
    });

    binder.bind("stoplichten", {
        checksFor: "protocol",
        description: "Controleert of de meegeven keys bestaan volgens het protocol. Raadpleeg [Brug_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png) en [Kruispunt_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png) voor een overzicht van erkende stoplichten",
        method: useIdentiteitIsErkend(trafficData)
    })

    return binder
}