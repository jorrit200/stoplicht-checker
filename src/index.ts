import {Subscriber} from "zeromq";
import {ZMQSubCheckerBinder} from "./Service/ZMQSubCheckerBinder";
import {LogConclusionAsMarkDown} from "./Loggers/LogConclusionAsMarkDown";
import {TrafficData} from "./Data/TrafficData";
import {bindStoplichtTopicProtocol} from "./Checkers/stoplichten";
import {Traffic} from "./Service/Traffic";
import {config} from "./Config/conf"
import {promises as fs} from "fs"

async function run() {
    if (config.get('output.wipe_on_start')) {
        const outputDir = config.get('output.dir')
        await fs.rm(outputDir, {recursive: true, force: true});
        await fs.mkdir(outputDir);
    }
    console.log("Verkeer data inladen...");
    const trafficDataRes = await fetch("https://raw.github.com/jorrit200/stoplicht-communicatie-spec/main/intersectionData/lanes.json")
    if (!trafficDataRes.ok) {
        throw new Error("Kon de verkeersdata niet laden, deze is nodig om sommige protocol eisen te beoordelen")
    }
    const trafficData = await trafficDataRes.json() as TrafficData
    let traffic = new Traffic(trafficData);
    console.log("data ingeladen")

    const controllerSubscriber = new Subscriber();
    controllerSubscriber.connect(`tcp://${config.get('controller.host')}:${config.get('controller.port')}`);

    const simulationSubscriber = new Subscriber();
    simulationSubscriber.connect(`tcp://${config.get('simulator.host')}:${config.get('simulator.port')}`)

    let controllerBinder = new ZMQSubCheckerBinder(controllerSubscriber);
    let simulationBinder = new ZMQSubCheckerBinder(simulationSubscriber);


    bindStoplichtTopicProtocol(controllerBinder, traffic)
    // bindSensorRijbaanTopicProtocol(simulationBinder, traffic)
    // bindSensorSpecialTopicProtocol(simulationBinder, traffic)
    // bindTijdTopicProtocol(simulationBinder)


    const controllerTask = controllerBinder.run({
        resultOutput: (c) => {
            console.log("controller ontvangen")
            LogConclusionAsMarkDown(c)
        }
    });


    const simulatorTask = simulationBinder.run({
        resultOutput: (c) => {
            console.log("simulator ontvangen")
            LogConclusionAsMarkDown(c)
        }
    })

    await Promise.all([controllerTask, simulatorTask])





    
}

run().then(r => console.log('done'));
