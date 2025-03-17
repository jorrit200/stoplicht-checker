import {Subscriber} from "zeromq";
import {TopicCheckerResult, ZMQSubCheckerBinder} from "./Service/ZMQSubCheckerBinder";
import {LogConclusionAsMarkDown} from "./Loggers/LogConclusionAsMarkDown";
import {TrafficData} from "./Data/TrafficData";
import {bindStoplichtTopicProtocol} from "./Checkers/stoplichten";

async function run() {
    console.log("Verkeer data inladen...");
    const trafficDataRes = await fetch("https://raw.github.com/jorrit200/stoplicht-communicatie-spec/main/intersectionData/lanes.json")
    if (!trafficDataRes.ok) {
        throw new Error("Kon de verkeers data niet laden, deze is nodig om sommige protocol eisen te beoordelen")
    }
    const trafficData = await trafficDataRes.json() as TrafficData
    console.log("data ingeladen")

    const sub = new Subscriber();
    sub.connect("tcp://127.0.0.1:5556");

    let binder = new ZMQSubCheckerBinder(sub);
    binder = bindStoplichtTopicProtocol(binder)

    await binder.run({
        resultOutput: LogConclusionAsMarkDown
    });
}

run().then(() => console.log("done"));
