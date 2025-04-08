import convict from "convict";
import convict_format_with_validator from "convict-format-with-validator";
convict.addFormat(convict_format_with_validator.ipaddress)

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
    simulator: {
        port: {
            doc: 'The port at which the regression checker accepts simulation messages.',
            format: 'port',
            default: 5551,
            env: 'SIMULATION_PORT'
        },
        host: {
            doc: 'The IP at which the regression checker accepts simulation messages.',
            format: 'ipaddress',
            default: '127.0.0.1',
            env: 'SIMULATION_IP'
        },
        subscribe: {
            doc: "The topics to of the simulation to subscribe to",
            format: manyOfFormat(["sensoren_rijbaan", "sensoren_speciaal", "time", "voorrangsvoertuigen"]),
            default: ["sensoren_rijbaan", "sensoren_speciaal", "time", "voorrangsvoertuigen"]
        },
    },

    controller: {
        port: {
            doc: 'The port at which the regression checker accepts controller messages.',
            format: 'port',
            default: 5552,
            env: 'CONTROLLER_PORT'
        },
        host: {
            doc: 'The IP at which the regression checker accepts controller messages.',
            format: 'ipaddress',
            default: '127.0.0.1',
            env: 'CONTROLLER_IP'
        },
        subscribe: {
            doc: "The topics to of the controller to subscribe to",
            format: manyOfFormat(["stoplichten"]),
            default: ["stoplichten"]
        }
    },

    output: {
        dir: {
            doc: 'The dir to which the program writes',
            format: String,
            default: './output',
        },
        wipe_on_start: {
            doc: 'When true: wipes the output directory on startup.',
            format: Boolean,
            default: false
        },
        log_perfect_messages: {
            doc: 'When true: outputs a report for all messages. When false: only write reports for messages with an error.',
            format: Boolean,
            default: false
        }
    },

    config_file: {
        doc: 'The config file which is read to configure the program',
        format: String,
        default: './config.json',
    }

})
config.loadFile(config.get('config_file'))
console.log('loaded the damn config')
