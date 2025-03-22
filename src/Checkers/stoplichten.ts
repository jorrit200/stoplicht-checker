import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";
import {useTraffic} from "./modefiers";


export const bindStoplichtTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic): ZMQSubCheckerBinder => {
    binder.bind("stoplichten", {
        name: "Stoplicht ID formaat",
        checksFor: "protocol",
        description: "Controleert of alle keys in hetzelfde formaat zijn als een stoplicht id. Zoals beschreven in de spec. `g.l`",
        method: trafficLightIdFormat
    });

    binder.bind("stoplichten", {
        name: "Stoplicht waarden geldig",
        checksFor: "protocol",
        description: 'Controleert of alle waardes van de message binnen de mogelijk waardes valt: ["rood", "oranje", "groen"]',
        method: allTrafficlightStatesAreValid
    });

    binder.bind("stoplichten", {
        name: "Stoplicht ID's bestaan",
        checksFor: "protocol",
        description: "Controleert of de meegeven keys bestaan volgens het protocol. Raadpleeg [Brug_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png) en [Kruispunt_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png) voor een overzicht van erkende stoplichten",
        method: useTraffic(allIncludedIdsAreKnown, traffic)
    })

    binder.bind("stoplichten", {
        name: "Ale erkende stoplicht Ids zijn meegegeven",
        checksFor: "protocol",
        description: "Contoleer of alle stoplicht ids die erkend worden door de specs, meegeven worden als keys in het bericht. Dit is noodzakelijk omdat het protocol eist dat elk bericht de volledige staat van de topic mee geeft.",
        method: useTraffic(allKnownIdsAreIncluded, traffic)
    })

    binder.bind("stoplichten", {
        name: "Intersecties tussen groene stoplichten",
        checksFor: "intention",
        description: "Controleert of er geen collisies mogelijk zijn met alle stoplichten die op groen staan",
        method: useTraffic(noIntersectionsBetweenGreenGroups, traffic)
    })

    return binder
}


export const trafficLightIdFormat = (message: any): TopicCheckerResult => {
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

const allTrafficlightStatesAreValid = (message: { [key: string]: "rood" | "groen" | "oranje" }): TopicCheckerResult => {
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

export const allIncludedIdsAreKnown = (message: {
    [key: string]: any
}, traffic: Traffic): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const messageKeyLength = Object.keys(message).length;
    const acknowledgedTrafficLightKeys = traffic.getAllIds()
    for (const key in message) {
        if (!acknowledgedTrafficLightKeys.includes(key)) {
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

export const allKnownIdsAreIncluded = (
    message: { [key: string]: any },
    traffic: Traffic
): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const acknowledgedTrafficLightKeys = traffic.getAllIds()
    const messageKeys = Object.keys(message);
    for (const key of acknowledgedTrafficLightKeys) {
        if (!messageKeys.includes(key)) {
            result.isOk = false;
            result.feedback.push(`Het stoplicht id: '${key}' is niet mee gegeven in het het bericht. Het protocol eist dat alle berichten de volledige staat van de toppic beschrijven, dus moet elk erkend stoplicht ID meegegeven worden.`)
        }
    }

    if (result.feedback.length > acknowledgedTrafficLightKeys.length / 2) {
        result.feedback = ["De meeste stoplicht ids zijn niet meegegeven. Raadpleeg <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png'>Brug_verkeerslichten.png</a> en <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png'>Kruispunt_verkeerslichten.png</a> voor een overzicht van de stoplicht ids die erkend worden door het protocol. Het protocol eist dat een bericht de volledige status van een topic bevat, dus moeten al deze ids meegegeven worden als keys."]
    }

    if (result.feedback.length == acknowledgedTrafficLightKeys.length) {
        result.feedback = ["Geen één van de meegegeven keys is een erkend stoplicht id. Raadpleeg <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png'>Brug_verkeerslichten.png</a> en <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png'>Kruispunt_verkeerslichten.png</a> voor een overzicht van de stoplicht ids die erkend worden door het protocol."]
    }
    return result
}

const noIntersectionsBetweenGreenGroups = (
    message: { [key: string]: "rood" | "groen" | "oranje" },
    traffic: Traffic
): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as { isOk: boolean, feedback: string[] };

    const greens = Object.keys(message)
        .filter(key => message[key] === "groen")
        .map(key => Number.parseInt(key.split('.')[0]));

    const greensUnique = [...new Set(greens)]

    const greenIntersections = traffic.getIntersects(greensUnique)
    Object.keys(greenIntersections)
        .map(key => Number.parseInt(key)) // Object.keys hard returns string[] even though ts knows our record is keyof int
        .filter(key => greenIntersections[key].length > 0)
        .forEach(key => {
            result.isOk = false
            result.feedback.push(`Je hebt een stoplicht in groep ${key} op groen gezet, maar de groep(en) ${greenIntersections[key].join(',')} hebben een intersectie met deze groep, en staan ook op groen.`)
        })

    return result
}