import { Subscriber } from "zeromq";
import { ZMQSubCheckerBinder } from "./Service/ZMQSubCheckerBinder";
import { LogConclusionAsMarkDown } from "./Loggers/LogConclusionAsMarkDown";
import { TrafficData } from "./Data/TrafficData";
import { bindStoplichtTopicProtocol } from "./Checkers/stoplichten";
import { Traffic } from "./Service/Traffic";
import { config } from "./Config/conf";
import { promises as fs } from "fs";

async function setupOutputDirectory() {
    const outputDir = config.get('output.dir');
    if (config.get('output.wipe_on_start')) {
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.mkdir(outputDir);
    }
}

async function loadTrafficData(): Promise<TrafficData> {
    console.log("Loading traffic data…");
    const trafficDataRes = await fetch("https://raw.github.com/jorrit200/stoplicht-communicatie-spec/main/intersectionData/lanes.json");
    if (!trafficDataRes.ok) {
        throw new Error("Failed to load traffic data – required for protocol validation");
    }
    const trafficData = await trafficDataRes.json() as TrafficData;
    console.log("Traffic data loaded.");
    return trafficData;
}

function setupSubscribers() {
    const controllerSubscriber = new Subscriber();
    const simulationSubscriber = new Subscriber();
    controllerSubscriber.connect(`tcp://${config.get('controller.host')}:${config.get('controller.port')}`);
    simulationSubscriber.connect(`tcp://${config.get('simulator.host')}:${config.get('simulator.port')}`);

    return {
        controllerBinder: new ZMQSubCheckerBinder(controllerSubscriber),
        simulationBinder: new ZMQSubCheckerBinder(simulationSubscriber)
    };
}

async function runApp() {
    try {
        await setupOutputDirectory();
        const trafficData = await loadTrafficData();
        const traffic = new Traffic(trafficData);

        const { controllerBinder, simulationBinder } = setupSubscribers();

        // Bind protocols
        bindStoplichtTopicProtocol(controllerBinder, traffic);
        // Uncomment and bind additional protocols as needed:
        // bindSensorRijbaanTopicProtocol(simulationBinder, traffic);
        // bindSensorSpecialTopicProtocol(simulationBinder, traffic);
        // bindTijdTopicProtocol(simulationBinder);

        const controllerTask = controllerBinder.run({
            resultOutput: (conclusion) => {
                console.log("Controller message received");
                LogConclusionAsMarkDown(conclusion);
            }
        });

        const simulatorTask = simulationBinder.run({
            resultOutput: (conclusion) => {
                console.log("Simulator message received");
                LogConclusionAsMarkDown(conclusion);
            }
        });

        await Promise.all([controllerTask, simulatorTask]);
        console.log("All tasks completed.");
    } catch (error) {
        console.error("Error while running the app:", error);
        process.exit(1);  // Exit with an error code if needed
    }
}

runApp().then(() => console.log('Done'));
