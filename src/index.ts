import {Subscriber} from "zeromq";


async function run() {
    const sub = new Subscriber()

    sub.connect("tcp://127.0.0.1:5556")
    sub.subscribe("stoplichten")

    console.log("Subscribed to stoplichten")

    for await (const [topic, msg] of sub) {
        console.log("topic: ", topic.toString(), "msg: ", msg.toString())
    }
}

run().then(r => console.log('done'))
