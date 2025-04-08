import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";
import {allIncludedIdsAreKnown, allKnownIdsAreIncluded, trafficLightIdFormat} from "./stoplichten";
import {useTraffic} from "./modefiers";

/**
 * Binds checks to the "sensoren_rijbaan" topic,
 * And checks if the protocol is adhered to.
 * https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/topics/sensoren_rijbaan
 * @param binder The binder to add the checks to
 * @param traffic The traffic data to base some checks on
 */
export const bindSensorRijbaanTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic) => {
    binder.bind("sensoren_rijbaan", {
        name: "Rijbaan ID formaat",
        checksFor: "protocol",
        description: "Controleert of alle keys in hetzelfde formaat zijn als een rijbaan id. Zoals beschreven in de spec: `g.l`",
        method: trafficLightIdFormat,
    })

    binder.bind("sensoren_rijbaan", {
        name: "Rijbaan IDs bestaan",
        checksFor: "protocol",
        description: "Controleert of de meegeven keys bestaan volgens het protocol. Raadpleeg [Brug_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Brug_verkeerslichten.png) en [Kruispunt_verkeerslichten.png](https://github.com/jorrit200/stoplicht-communicatie-spec/blob/main/assets/Kruispunt_verkeerslichten.png) voor een overzicht van erkende rijbanen",
        method: useTraffic(allIncludedIdsAreKnown, traffic),
    })

    binder.bind("sensoren_rijbaan", {
        name: "Alle bekende rijbaan IDs zijn meegegeven",
        checksFor: "protocol",
        description: "Contoleer of alle stoplicht ids die erkend worden door de specs, meegeven worden als keys in het bericht. Dit is noodzakelijk omdat het protocol eist dat elk bericht de volledige staat van de topic mee geeft.",
        method: useTraffic(allKnownIdsAreIncluded, traffic),
    })

    binder.bind("sensoren_rijbaan", {
        name: "Sensor namen",
        checksFor: "protocol",
        description: 'Volgens het protocol moet elke rijbaan een "voor" en "achter" sensor hebben. Niet meer, niet minder.',
        method: sensorKeys,
    })

    binder.bind("sensoren_rijbaan", {
        name: "Sensor waarden",
        checksFor: "protocol",
        description: "",
        method: sensorValues,
    })
}

const sensorKeys = (message: Record<string, {voor: boolean, achter: boolean}>): TopicCheckerResult => {
    const result = new TopicCheckerResult()
    const requiredSensorNames = ['voor', 'achter']

    Object.entries(message).forEach(([laneId, lane]) => {
        const sensorNames = Object.keys(lane)

        const unknownSensors = sensorNames.filter(sensorName => !requiredSensorNames.includes(sensorName));
        unknownSensors.forEach(sensorName => {
            result.fail(`voor rijbaan/stoplicht ${laneId}: ${sensorName} wordt niet erkend als sensor naam. De bekende namen zijn: ${requiredSensorNames.join(', ')}`)
        })

        const missingSensors = requiredSensorNames.filter(sensorName => !sensorNames.includes(sensorName));
        missingSensors.forEach(sensorName => {
            result.fail(`Voor rijbaan/stoplicht ${laneId}: is de noodzakelijke sensor "${sensorName}" niet meegeven. Alle rijbanen moeten de status van deze sensoren aangeven`)
        })
    })

    return result
}

const sensorValues = (message: Record<string, { voor: boolean, achter: boolean }>): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    Object.entries(message).forEach(([laneId, lane]) => {
        const sensorStates = Object.entries(lane)
        const noneBooleans = sensorStates.filter(([_, sensorState]) => typeof sensorState !== 'boolean')
        noneBooleans.forEach(([sensorName, sensorState]) => {
            result.fail(`Voor rijbaan/stoplicht ${laneId}, sensor ${sensorName}: ${sensorState} is geen boolean. Het protocol verijst dat de waarde van elke sensor een boolean is. Niet ${typeof sensorState}`)
        })
    })
    return result
}