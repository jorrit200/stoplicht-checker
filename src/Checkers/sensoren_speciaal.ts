import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";
import {useTraffic} from "./modefiers";

/**
 * Binds some checks to the "sensoren_speciaal" topic,
 * that ensure the messages with that topic adhere to the protocol:
 * https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/topics/sensoren_speciaal
 * @param binder The binder to add the checks to.
 * @param traffic The traffic data to base some checks on.
 */
export const bindSensorSpecialTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic) => {
    binder.bind("sensoren_speciaal", {
        name: "Sensor namen",
        checksFor: "protocol",
        description: "Controleert of alle verwachte namen mee worden gegeven in het bericht, en er geen onbekende sensoren worden meegegeven.",
        method: useTraffic(specialSensorIds, traffic),
    })

    binder.bind("sensoren_speciaal", {
        name: "Sensor waardes",
        checksFor: "protocol",
        description: "De waarde van elke speciale sensor moet een boolean zijn.",
        method: specialSensorValues,
    })
}

const specialSensorIds = (message: Record<string, boolean>, traffic: Traffic): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const knownSensors = traffic.getSpecialSensors().map(sensor => sensor.name)

    const unknownSensors = Object.keys(message).filter(sensor => !knownSensors.includes(sensor));
    unknownSensors.forEach(sensor => {
        result.fail(`De sensor "${sensor}" wordt niet erkend door het protocol.`)
    })

    const missingSensors = knownSensors.filter(sensor => !Object.keys(message).includes(sensor));
    missingSensors.forEach(sensor => {
        result.fail(`De sensor "${sensor}" mist in dit bericht.`)
    })

    return result
}

const specialSensorValues = (message: Record<string, boolean>): TopicCheckerResult => {
    const result = new TopicCheckerResult()
    
    Object.entries(message)
        .filter(([_, value]) => typeof value !== 'boolean')
        .forEach(([name, value]) => {
            result.fail(`De sensor "${name}" heeft geen boolean als waarde. Waarde is ${value} met type ${typeof value}`)
        })
    return result
}