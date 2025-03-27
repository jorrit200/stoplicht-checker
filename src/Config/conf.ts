import convict from "convict";

const manyOfFormat = <T>(set: T[]): (val: T[]) => void => {
    const allowedSet = new Set(set);
    return (val) => {
        const unknownValues = val.filter(v => !allowedSet.has(v));
        unknownValues.forEach(v => {
            throw new Error(`Unsupported value: ${v}. Must be one of ${Array.from(allowedSet).join(", ")}`);
        })
    }
}

export const config = convict({
    simulation_port: {
        doc: 'The port at which the regression checker accepts simulation messages.',
        format: 'port',
        default: 5551,
        env: 'PORT_SIMULATION'
    },
    controller_port: {
        doc: 'The port at which the regression checker accepts controller messages.',
        format: 'port',
        default: 5552,
        env: 'PORT_CONTROLLER'
    },
    output_dir: {
        doc: 'The dir to which the program writes',
        format: 'dir',
        default: './output',
    },
    config_file: {
        doc: 'File from which to load the config',
        format: 'filename',
        default: './Config/config.json',
    },
    subscribe: {
        doc: "The topics to subscribe to",
        format: manyOfFormat(["sensoren_rijbaan", "sensoren_speciaal", "stoplichten", "time", "voorrangsvoertuigen"]),
        default: ["sensoren_rijbaan", "sensoren_speciaal", "stoplichten", "time"],
        env: 'SUBSCRIBE'
    },

})