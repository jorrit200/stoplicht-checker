import {Subscriber} from "zeromq";



export class ZMQSubCheckerBinder {
    private readonly sub: Subscriber

    private bindings = new Map<string, TopicChecker[]>();

    constructor(sub: Subscriber) {
        this.sub = sub
    }

    public bind(topic: string, checker: TopicChecker) {
        if (this.bindings.has(topic)) {
            const boundCheckers = this.bindings.get(topic)
            if (boundCheckers === undefined) {
                throw new Error("Corrupt bindings map")
            }
            this.bindings.set(topic, [...boundCheckers, checker])

        } else {
            this.bindings.set(topic, [checker])
        }
    }

    public async run() {
        this.sub.subscribe(...this.bindings.keys())

        for await (const [topic, msg] of this.sub) {
            const topicStr = topic.toString()
            const msgObj = JSON.parse(msg.toString())

            const boundCheckers = this.bindings.get(topicStr)

            if (boundCheckers === undefined) {
                console.warn("Unbound topic: ", topic)
                continue
            }

            boundCheckers.forEach(checker => {
                const result = checker.checker(msgObj)
                console.log(checker.name, ": ", result ? "YIPPEEE": "OHNO")
            })
        }
    }
}

export interface TopicChecker
{
    checker: (message: {}) => boolean,
    name: string
}