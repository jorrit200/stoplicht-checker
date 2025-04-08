import {TopicCheckerResult, ZMQSubCheckerBinder} from "../Service/ZMQSubCheckerBinder";
import {Traffic, TrafficLightId} from "../Service/Traffic";
import {useTraffic} from "./modefiers";

export const bindVoorrangsvoertuigTopicProtocol = (binder: ZMQSubCheckerBinder, traffic: Traffic): void => {
    binder.bind("voorrangsvoertuig", {
        name: 'Key is "queue"',
        checksFor: "protocol",
        description: 'Het protocol verijst dat het json object één top-level key bevat: "queue"',
        method: queueKey,
    })

    binder.bind("voorrangsvoertuig", {
        method: queueIsArray,
        name: "Queue is een array",
        checksFor: "protocol",
        description: "De queue waarde moet een array zijn"
    })

    binder.bind("voorrangsvoertuig", {
        name: "Queue item keys",
        checksFor: "protocol",
        description: 'Controleert of elk van de objecten in de queue de volgende keys hebben: "baan", "simulatie_tijd_ms" en "prioriteit".',
        method: queueItemKeys,
    })

    binder.bind("voorrangsvoertuig", {
        name: "Baan ID formaat",
        checksFor: "protocol",
        description: "Controleert of de meegegeven baan wel in het `g.l` formaat is.",
        method: queueLaneIdFormat,
    })

    binder.bind("voorrangsvoertuig", {
        name: "Baan ID bestaat",
        checksFor: "protocol",
        description: "Controleert of elk van de meegegeven ids bestaan volgens het protocol.",
        method: useTraffic(queueLaneIdExists, traffic),
    })

    binder.bind("voorrangsvoertuig", {
        name: "Tijd is int",
        checksFor: "protocol",
        description: "Controleert of de meegegeven tijd wel een valide int is.",
        method: simulationTimesIsInt,
    })

    binder.bind("voorrangsvoertuig", {
        name: "Prioriteit is 1 of 2",
        checksFor: "protocol",
        description: "het veld prioriteit voor een item in de queue, moet 1 of 2 zijn.",
        method: priorityIsOneOrTwo,
    })
}

const queueKey = (message: { queue: Voorrangvoertuig[] }): TopicCheckerResult => {
    const result = new TopicCheckerResult();

    const requiredKey = "queue"

    const keys = Object.keys(message)
    if (keys.length !== 1) {
        result.fail(`Dit message moet precies één top-level key hebben: "${requiredKey}". Deze message heeft er ${keys.length}: ${keys.join(', ')}`)
    }

    if (keys[0] !== "queue") {
        result.fail(`De key moet "${requiredKey}" zijn. De meegegeven keys is ${keys[0]}`)
    }

    return result
}


const queueIsArray = (message: { queue: Voorrangvoertuig[] }): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const values = Object.values(message);

    if (values.length !== 1) {
        result.fail("De queue waarde moet een enkele array zijn. Dit bericht bevat verschillende top-level waarden, inplaats van een array.")
    }

    const value = values[0]

    if (!Array.isArray(value)) {
        result.fail(`De waarde van "queue" moet een array zijn. dit bericht heeft: ${value} van type ${typeof value}`)
    }

    return result
}

const queueItemKeys = (message: { queue: Voorrangvoertuig[] }): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const requiredKeys = ['baan', 'simulatie_tijd_ms', 'prioriteit']
    const queue = message.queue

    queue.forEach((voorrangsvoertuig, queueIndex) => {
        const voorrangsvoertuigKeys = Object.keys(voorrangsvoertuig)

        const unknownKeys = voorrangsvoertuigKeys.filter(key => !requiredKeys.includes(key))
        unknownKeys.forEach((key) => {
            result.fail(`Voor queue[${queueIndex}]: ${key} is niet één van de bekende keys voor de entries in een queue. De bekende keys zijn: ${requiredKeys.join(', ')}`)
        })

        const missingKeys = requiredKeys.filter(key => !voorrangsvoertuigKeys.includes(key))
        missingKeys.forEach((key) => {
            result.fail(`Voor queue[${queueIndex}]: mist de key "${key}" uit het meegeven object. Deze is noodzakelijk.`)
        })
    })

    return result
}

const queueLaneIdFormat = (message: { queue: Voorrangvoertuig[] }): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    message.queue.forEach((voorrangsvoertuig, queueIndex) => {
        try {
            TrafficLightId.fromString(voorrangsvoertuig.baan);
        } catch (e) {
            result.fail(`Voor queue[${queueIndex}]: is de meegegeven baan geen valide stoplicht/baan id. ${(voorrangsvoertuig.baan)} voldoet niet aan het formaat \`g.l\``)
        }
    })

    return result
}

const queueLaneIdExists = (message: { queue: Voorrangvoertuig[] }, traffic: Traffic): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    const knownLaneKeys = traffic.getAllIds()
    message.queue.forEach((voorrangsvoertuig, queueIndex) => {
        if (!knownLaneKeys.includes(voorrangsvoertuig.baan)) {
            result.fail(`Voor queue[${queueIndex}]: ${voorrangsvoertuig.baan} staat niet in de lijst van erkende banen.`)
        }
    })

    return result
}


const simulationTimesIsInt = (message: { queue: Voorrangvoertuig[]}): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    message.queue.forEach((voorrangsvoertuig, queueIndex) => {
        if (!Number.isInteger(voorrangsvoertuig.simulatie_tijd_ms)) {
            result.fail(`Voor queue[${queueIndex}]: ${voorrangsvoertuig.simulatie_tijd_ms} is geen integer. (parsed als ${typeof voorrangsvoertuig.simulatie_tijd_ms})`)
        }
    })

    return result
}

const priorityIsOneOrTwo = (message: {queue : Voorrangvoertuig[]}): TopicCheckerResult => {
    const result = new TopicCheckerResult()

    message.queue.forEach((voorrangsvoertuig, queueIndex) => {
        if (!Number.isInteger(voorrangsvoertuig.prioriteit)) {
            result.fail(`Voor queue[${queueIndex}]: Prioriteit moet een integer zijn. Meegegeven: ${voorrangsvoertuig.prioriteit} (${typeof voorrangsvoertuig.prioriteit})`)
        }
        if (![1,2].includes(voorrangsvoertuig.prioriteit)) {
            result.fail(`Voor queue[${queueIndex}]: Prioriteit moet 1 of 2 zijn, niet: ${voorrangsvoertuig.prioriteit}`)
        }
    })

    return result
}

interface Voorrangvoertuig {
    baan: string,
    simulatie_tijd_ms: number
    prioriteit: number
}
