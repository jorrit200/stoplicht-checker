import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";
import {useTraffic} from "./modefiers";


/**
 * Adds some checks to the "stoplichten" topic to ensure that messages with this topic adhere to the protocol:
 * https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/topics/stoplichten
 * @param binder The binder to add the checks to
 * @param traffic The traffic data to base some checks on.
 */
export const bindStoplichtTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic) => {
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
        method: allTrafficLightStatesAreValid
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
}


export const trafficLightIdFormat = (message: any): TopicCheckerResult => {
    const result = new TopicCheckerResult();

    const idPattern = /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;

    const messageKeysLength = Object.keys(message).length

    Object.keys(message)
        .filter(key => !idPattern.test(key))
        .forEach(key => {
            result.fail(`key: ${key} voldoet niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane`)
        })

    if (result.feedback.length > messageKeysLength / 2) {
        result.collapseFeedback(["De meeste keys voldoen niet aan het 'g.l' format. Waar 'g' voor group staat en 'l' voor lane."]);
    }
    return result;
}

const allTrafficLightStatesAreValid = (message: { [key: string]: "rood" | "groen" | "oranje" }): TopicCheckerResult => {
    const result = new TopicCheckerResult();

    const validStates = ["groen", "oranje", "rood"];

    const messageKeyLength = Object.keys(message).length;

    Object.entries(message)
        .filter(([_, value]) => !validStates.includes(value))
        .forEach(([key, value]) => {
            result.fail(`Key: ${key} Value: ${value} is niet één van ["rood", "oranje", "groen"]. Check voor spelfouten en NL/EN.`)
        })

    if (result.feedback.length > (messageKeyLength / 2)) {
        result.collapseFeedback(['De meeste values zijn niet één van ["rood", "oranje", "groen"]).'])
    }

    if (result.feedback.length > messageKeyLength) {
        result.collapseFeedback(['De values voldoen niet aan de requirement: ["rood", "oranje", "groen"]).'])
    }

    return result;
}

export const allIncludedIdsAreKnown = (message: Record<string, any>, traffic: Traffic): TopicCheckerResult => {
    const result = new TopicCheckerResult();

    let keys = Object.keys(message);
    const acknowledgedTrafficLightKeys = traffic.getAllIds()

    keys.filter(key => !acknowledgedTrafficLightKeys.includes(key))
        .forEach(key => {
            result.fail(`Key: ${key} wordt niet erkend als een bestaand stoplicht volgens het protocol.`)
        })

    if (result.feedback.length > keys.length / 2) {
        result.collapseFeedback(["De meeste meegegeven keys worden niet erkend als bestaande stoplichten volgens het protocol."])
    }
    if (result.feedback.length == keys.length) {
        result.collapseFeedback(["Geen één van de meegegeven keys wordt erkend als een bestaand stoplicht volgens het protocol"])
    }
    return result
}

export const allKnownIdsAreIncluded = (
    message: Record<string, any>,
    traffic: Traffic
): TopicCheckerResult => {
    const result = new TopicCheckerResult();

    const acknowledgedTrafficLightKeys = traffic.getAllIds()
    const messageKeys = Object.keys(message);

    const missingKeys = acknowledgedTrafficLightKeys.filter(key => !messageKeys.includes(key))
    missingKeys.forEach(key => {
        result.fail(`Het stoplicht id: '${key}' is niet mee gegeven in het het bericht. Het protocol eist dat alle berichten de volledige staat van de toppic beschrijven, dus moet elk erkend stoplicht ID meegegeven worden.`)
    })

    if (result.feedback.length > acknowledgedTrafficLightKeys.length / 2) {
        result.collapseFeedback(["De meeste stoplicht ids zijn niet meegegeven. Raadpleeg <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png'>Brug_verkeerslichten.png</a> en <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png'>Kruispunt_verkeerslichten.png</a> voor een overzicht van de stoplicht ids die erkend worden door het protocol. Het protocol eist dat een bericht de volledige status van een topic bevat, dus moeten al deze ids meegegeven worden als keys."])
    }

    if (result.feedback.length == acknowledgedTrafficLightKeys.length) {
        result.collapseFeedback(["Geen één van de meegegeven keys is een erkend stoplicht id. Raadpleeg <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png'>Brug_verkeerslichten.png</a> en <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png'>Kruispunt_verkeerslichten.png</a> voor een overzicht van de stoplicht ids die erkend worden door het protocol."])
    }
    return result
}

const noIntersectionsBetweenGreenGroups = (
    message: Record<string, "rood" | "groen" | "oranje">,
    traffic: Traffic
): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const greenGroups = Object.keys(message)
        .filter(key => message[key] === "groen")
        .map(key => Number.parseInt(key.split('.')[0]))

    const greensUnique = [...new Set(greenGroups)]

    const greenIntersections = traffic.getIntersects(greensUnique)
    Object.keys(greenIntersections)
        .map(key => Number.parseInt(key)) // Object.keys hard returns string[] even though ts knows our record is keyof int
        .filter(key => greenIntersections[key].length > 0)
        .forEach(key => {
            result.fail(`Je hebt een stoplicht in groep ${key} op groen gezet, maar de groep(en) ${greenIntersections[key].join(',')} hebben een intersectie met deze groep, en staan ook op groen.`)
        })

    return result
}