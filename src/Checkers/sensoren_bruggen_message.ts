import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";


type sensoren_bruggen_message = Record<string, { state: "open" | "dicht" | "onbekend" }>;

export const bindSensorenBruggen = (binder: ZMQSubCheckerBinder) => {
    binder.bind("sensoren_bruggen", {
        name: "Buitenste sleutel is 81.1",
        checksFor: 'protocol',
        description: 'Dit message heeft maar 1 key, en deze moet 81.1 zijn',
        method: outerKeyIsCorrect
    })

    binder.bind("sensoren_bruggen", {
        name: "Binnenste sleutel is state",
        checksFor: 'protocol',
        description: 'De binnenste sleutel van het message object moet `state` zijn',
        method: innerKeyIsCorrect
    })

    binder.bind("sensoren_bruggen", {
        name: "State is valide",
        checksFor: 'protocol',
        description: 'De staat moet een van open dicht onbekend zijn',
        method: stateIsValid
    })
}

const outerKeyIsCorrect = (message: sensoren_bruggen_message): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const keys = Object.keys(message)
    if (keys.length != 1) {
        result.fail("message object moet één key hebben, en zijn waarde moet `81.1` zijn. Dit bericht heeft 0 keys, of meerdere keys")
    }

    if (keys[0] !== "81.1") {
        result.fail('message top-level key moet `81.1` zijn')
    }

    return result
}

const innerKeyIsCorrect = (message: sensoren_bruggen_message): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const innerObject = message["81.1"]
    if (innerObject === null) {
        result.fail("check gefaald door falen vorige check.")
        return result
    }

    const innerKeys = Object.keys(innerObject)

    if (innerKeys.length != 1) {
        result.fail("Binnenste object moet één key hebben en deze moet `state` zijn. Het object heeft hier 0 of meer dan 1 keys")
    }

    if (innerKeys[0] !== "state") {
        result.fail("Binnenste object moet de `state` key hebben.")
    }

    return result
}

const stateIsValid = (message: sensoren_bruggen_message): TopicCheckerResult => {
    const result = new TopicCheckerResult()
    const state = message["81.1"].state
    if (state === null) {
        result.fail("Check gefaald door alen eerder check")
    }

    if (!['open', 'dicht', 'onbekend'].includes( state)) {
        result.fail(`De staat moet één van 'open, 'dicht', 'onbekend' zijn. Huidige stat is ${state}`)
    }
    return result
}