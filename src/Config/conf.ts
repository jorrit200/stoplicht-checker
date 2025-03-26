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

export const hardConfig = convict({
    subscribe_port: {
        doc: 'The port at which the regression checker accepts messages.',
        format: 'port',
        default: 5550,
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
    }
})

export const config = convict({
    subscribe: {
        doc: "The topics to subscribe to",
        format: manyOfFormat(["sensoren_rijbaan", "sensoren_speciaal", "stoplichten", "time", "voorrangsvoertuigen"]),
        default: ["sensoren_rijbaan", "sensoren_speciaal", "stoplichten", "time"],
        env: 'SUBSCRIBE'
    },


})