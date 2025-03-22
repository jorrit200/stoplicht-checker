import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";

export const bindTijdTopicProtocol = (binder: ZMQSubCheckerBinder) => {
    binder.bind("tijd", {
        name: "Key naam",
        checksFor: "protocol",
        description: 'Er is maar één key. Deze is "simulatie_tijd_ms"',
        method: timeKeyIsCorrect,
    })

    binder.bind("tijd", {
        method: timeValueIsInt,
        name: "Tijd is een integer",
        checksFor: "protocol",
        description: "De tijd is de simulatie tijd in hele milliseconden"
    })
}

const timeKeyIsCorrect = (message: {simulatie_tijd_ms: number}): TopicCheckerResult => {
    let result = new TopicCheckerResult()

    const keys = Object.keys(message)
    if (keys.length !== 1) {
        result.fail(`Messages in deze topic moeten precies 1 key hebben. Di bericht bevat ${keys.length} keys: ${keys.join(', ')}`)
    }
    if (keys[0] !== 'simulatie_tijd_ms') {
        result.fail(`De key moet "simulatie_tijd_ms" heten. Huidige key is ${keys[0]}"`)
    }

    return result
}

const timeValueIsInt = (message: {simulatie_tijd_ms: number}): TopicCheckerResult => {
    let result = new TopicCheckerResult()

    if (!Number.isInteger(message.simulatie_tijd_ms)) {
        result.fail(`De meegegeven simulatie tijd moet een integers zijn. Huidige tijd is ${message.simulatie_tijd_ms} (${typeof message.simulatie_tijd_ms})`)
    }

    return result
}