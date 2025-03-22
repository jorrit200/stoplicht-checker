import {Subscriber} from "zeromq";

/**
 * This is a class that helps to assign isolated tests to ZeroMQ topics.
 * Connect different tests to topics first, then run the tester.
 * This class wraps the ZeroMQ subscriber.
 */
export class ZMQSubCheckerBinder {
    private readonly sub: Subscriber
    private bindings = new Map<string, TopicChecker<any>[]>();

    /**
     * Maker a tester from this subscriber
     * @param sub The subscriber to turn into a tester. Warning: this subscriber will lose any topics its already subscribed to.
     */
    constructor(sub: Subscriber) {
        this.sub = sub
    }

    /**
     * Bind a checker to a topic.
     * @param topic The topic to bind to.
     * @param checker The check to execute for each message on the topic.
     */
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

    /**
     * Start running this binder. (for now there is no way to gracefully stop this...)
     * @param resultOutput a function that takes the results of all tests on a message. Useful for logging results.
     */
    public async run({resultOutput}: {resultOutput: (conclusion: TopicMessageConclusion) => void} = {resultOutput: console.log}) {
        this.sub.subscribe(...this.bindings.keys())

        for await (const [topic, msg] of this.sub) {


            const topicStr = topic.toString()
            let msgObj
            let msgStr = msg.toString();
            try {
                msgObj = JSON.parse(msgStr)
            } catch (e) {
                const conclusion: TopicMessageConclusion = {
                    topic: topicStr,
                    message: msgStr,
                    results: [{
                        checker: {
                            method: function (): TopicCheckerResult {
                                throw new Error("Function not implemented.");
                            },
                            name: "Parsing",
                            checksFor: "protocol",
                            description: ""
                        },
                        result: {
                            isOk: false,
                            feedback: ["Volgens het protocol moet elk bericht uit valide JSON bestaan"]
                        }
                    }],
                    timestamp: Date.now()
                }
                resultOutput(conclusion)
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

            const conclusion: TopicMessageConclusion = {
                topic: topicStr,
                message: msgObj,
                results: resultArr,
                timestamp: Date.now()
            }

            resultOutput(conclusion)
        }
    }
}

/**
 * An isolated check to judge the correctness of a message.
 */
export interface TopicChecker<TIn> {
    /**
     * The actual method that executes the check
     * @param message message gets passed by the binder, and is a JSON-parsed version of the raw data in the ZeroMQ message.
     */
    method: (message: TIn) => TopicCheckerResult,

    /**
     * The name of the check. Used for logging conclusions and self-documentation
     */
    name: string

    /**
     * Whether the check checks for an actual protocol violation or just for likely unintended state.
     */
    checksFor: "protocol" | "intention",

    /**
     * A human-readable description of the task, what it checks for, and why.
     */
    "description": string,
}

/**
 * The result of a check.
 * It contains whether the check passed,
 * and some human-readable strings that provide feedback to the programmer who sends the messages.
 */
export interface TopicCheckerResult {
    isOk: boolean
    feedback: string[]
}

/**
 * A collection of all the checker results for a single message.
 */
export interface TopicMessageConclusion {
    /**
     * The topic the message was sent over.
     */
    topic: string,

    /**
     * The JSON-parsed message.
     */
    message: {},

    /**
     * The results of each individual check.
     */
    results: {checker: TopicChecker<any>, result: TopicCheckerResult}[],

    /**
     * The time at which the message was parsed.
     */
    timestamp: number
}