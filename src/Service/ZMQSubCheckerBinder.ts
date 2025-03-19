import {Subscriber} from "zeromq";


export class ZMQSubCheckerBinder {
    private readonly sub: Subscriber

    private bindings = new Map<string, TopicChecker<any>[]>();

    constructor(sub: Subscriber) {
        this.sub = sub
    }

    public bind(topic: string, checker: TopicChecker<any>) {
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

    public async run({resultOutput}: {resultOutput: (conclusion: TopicCheckerConclusion) => void} = {resultOutput: console.log}) {
        this.sub.subscribe(...this.bindings.keys())

        for await (const [topic, msg] of this.sub) {


            const topicStr = topic.toString()
            let msgObj
            try {
                msgObj = JSON.parse(msg.toString())
            } catch (e) {
                console.error(e)
                continue
            }

            const boundCheckers = this.bindings.get(topicStr)

            if (boundCheckers === undefined) {
                console.warn("Unbound topic: ", topic)
                continue
            }

            const resultArr = boundCheckers.map(checker => {
                return {
                    checker: checker,
                    result: checker.method(msgObj)
                }
            });

            const conclusion: TopicCheckerConclusion = {
                topic: topicStr,
                message: msgObj,
                results: resultArr,
                timestamp: Date.now()
            }

            resultOutput(conclusion)
        }
    }
}

export interface TopicChecker<TIn> {
    method: (message: TIn) => TopicCheckerResult,
    checksFor: "protocol" | "intention",
    "description": string,
}

export type TopicCheckerResult = {
    isOk: true
} | {
    isOk: false
    feedback: string[]
}

export interface TopicCheckerConclusion {
    topic: string,
    message: {},
    results: {checker: TopicChecker<any>, result: TopicCheckerResult}[],
    timestamp: number
}