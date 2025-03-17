import {Subscriber} from "zeromq";
import {TopicCheckerResult, ZMQSubCheckerBinder} from "./Service/ZMQSubCheckerBinder";
import {LogConclusionAsMarkDown} from "./Loggers/LogConclusionAsMarkDown";



async function run() {
    const sub = new Subscriber();
    sub.connect("tcp://127.0.0.1:5556");

    const binder = new ZMQSubCheckerBinder(sub);

    await binder.run({
        resultOutput: LogConclusionAsMarkDown
    });
}

run().then(() => console.log("done"));
