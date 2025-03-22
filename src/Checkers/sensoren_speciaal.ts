import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";
import {useTraffic} from "./modefiers";

export const bindSensorSpecialTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic) => {
    binder.bind("sensoren_speciaal", {
        name: "Sensor namen",
        checksFor: "protocol",
        description: "Controleert of alle verwachte namen mee worden gegeven in het bericht, en er geen onbekende sensoren worden meegegeven.",
        method: useTraffic(specialSensorIds, traffic),
    })

    binder.bind("sensoren_speciaal", {
        name: "Senor waardes",
        checksFor: "protocol",
        description: "De waarde van elke speciale sensor moet een boolean zijn.",
        method: specialSenorValues,
    })
}

const specialSensorIds = (message: Record<string, boolean>, traffic: Traffic): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as TopicCheckerResult

    const knownSensors = traffic.getSpecialSenors().map(sensor => sensor.name)
    const sensors = Object.keys(knownSensors)

    sensors.filter(sensor => !knownSensors.includes(sensor))
        .forEach(sensor => {
            result.isOk = false
            result.feedback.push(`De sensor "${sensor}" wordt niet erkend door het protocol.`)
        })

    knownSensors.filter(sensor => !sensors.includes(sensor))
        .forEach(sensor => {
            result.isOk = false
            result.feedback.push(`De sensor "${sensor}" mist in dit bericht.`)
        })

    return result
}

const specialSenorValues = (message: Record<string, boolean>): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as TopicCheckerResult
    Object.entries(message)
        .filter(([_, value]) => typeof value !== 'boolean')
        .forEach(([name, value]) => {
            result.isOk = false
            result.feedback.push(`De sensor "${name}" heeft geen boolean als waarde. Waarde is ${value} met type ${typeof value}`)
        })
    return result
}