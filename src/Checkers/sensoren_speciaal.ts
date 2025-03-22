import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Vehicle} from "../Data/TrafficData";
import {Traffic} from "../Service/Traffic";
import {useTraffic} from "./modefiers";

export const bindSensorSpecialTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic): ZMQSubCheckerBinder => {
    binder.bind("sensoren_speciaal", {
        name: "Sensor namen",
        checksFor: "protocol",
        description: "Controleert of alle verwachte namen mee worden gegeven in het bericht, en er geen onbekende sensoren worden meegegeven.",
        method: useTraffic(specialSensorIds, traffic),
    })

    return binder
}

const specialSensorIds = (message: Record<string, boolean>, traffic: Traffic): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as TopicCheckerResult

    const knownSensors = traffic.getSpecialSenors().map(sensor => sensor.name)
    const sensors = Object.keys(knownSensors)

    const unknownSensors = sensors.filter(sensor => !knownSensors.includes(sensor))
    unknownSensors.forEach(sensor => {
        result.isOk = false
        result.feedback.push(`De sensor "${sensor}" wordt niet erkend door het protocol.`)
    })

    const missingSensors = knownSensors.filter(sensor => !sensors.includes(sensor))
    missingSensors.forEach(sensor => {
        result.isOk = false
        result.feedback.push(`De sensor "${sensor}" mist in dit bericht.`)
    })

    return result
}

const specialSenorValues = (message: Record<string, boolean>): TopicCheckerResult => {
    let result = {isOk: true, feedback: []} as TopicCheckerResult
    Object.entries(message)
        .filter(([name, value]) => {})
    // todo: dingen

    return result
}