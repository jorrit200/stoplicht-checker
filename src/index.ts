import { Subscriber } from "zeromq";
import { ZMQSubCheckerBinder } from "./Service/ZMQSubCheckerBinder";
import { LogConclusionAsMarkDown } from "./Loggers/LogConclusionAsMarkDown";
import { TrafficData } from "./Data/TrafficData";
import { bindStoplichtTopicProtocol } from "./Checkers/stoplichten";
import { Traffic } from "./Service/Traffic";
import { config } from "./Config/conf";
import { promises as fs } from "fs";

/**
 * Configures the output directory used for generated files.
 *
 * Reads the directory path from the configuration. If the "output.wipe_on_start" flag is enabled,
 * the existing directory and its contents are removed recursively before creating a new one.
 */
async function setupOutputDirectory() {
    const outputDir = config.get('output.dir');
    if (config.get('output.wipe_on_start')) {
        await fs.rm(outputDir, { recursive: true, force: true });
        await fs.mkdir(outputDir);
    }
}

/**
 * Loads traffic data from a remote JSON source.
 *
 * This asynchronous function fetches a JSON file containing traffic data, logs the process,
 * ensures that the HTTP response is successful, and parses the JSON into a TrafficData object.
 * If the fetch request fails, it throws an error indicating that traffic data is essential for protocol validation.
 *
 * @throws {Error} If the HTTP response indicates failure.
 * @returns A promise that resolves to the loaded traffic data.
 */
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

/**
 * Initializes and returns ZeroMQ binders for controller and simulation subscribers.
 *
 * This function creates two Subscriber instances, connects them to TCP endpoints specified in the configuration,
 * and wraps them in ZMQSubCheckerBinder instances. The returned binders are used to validate and handle incoming
 * messages from the controller and simulation processes.
 *
 * @returns An object containing the controller and simulation binders.
 */
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

/**
 * Orchestrates the traffic management application.
 *
 * This asynchronous function coordinates the application flow by setting up the output directory, loading traffic data, and initializing the Traffic instance. It configures ZeroMQ subscribers for the controller and simulator, binds the stoplight protocol for the controller, and concurrently runs tasks that handle incoming messages. If any error occurs during execution, it logs the error and terminates the process with a non-zero status code.
 */
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
