import {Sensor, TrafficData, TrafficLightGroup, TrafficLightLane} from "../Data/TrafficData";

export class Traffic {
    private readonly _data: TrafficData

    constructor(data: TrafficData) {
        this._data = data
    }

    getAllIds(): string[] {
        return Object.keys(this._data.groups)
            .flatMap((g) => Object.keys(this._data.groups[g].lanes)
                .map(l => `${g}.${l}`))
    }

    getGroup(id: number): TrafficGroup {
        return new TrafficGroup(id, this._data.groups[id])
    }

    getIntersects(ids: number[]): Record<number, number[]> {
        const ingoingGroups = [...new Set(ids)]
        let results: Record<number, number[]> = {}
        ingoingGroups.forEach(i => results[i] = this.getGroup(i)
            .getIntersects()
            .filter(intersect => ingoingGroups.includes(intersect)))
        return results
    }

    getSpecialSenors(): SpecialSensor[] {
        return Object.entries(this._data.sensors).map(([name, sensor]) => new SpecialSensor(name, sensor))
    }
}

export class TrafficGroup {
    private readonly _id: number
    private readonly _data: TrafficLightGroup

    constructor(groupId: number, data: TrafficLightGroup) {
        this._id = groupId;
        this._data = data
    }

    getIntersects(): number[] {
        return this._data.intersects_with
    }
}

export class TrafficLane {
    private readonly _id: TrafficLightId
    private readonly _data: TrafficLightLane

    constructor(id: TrafficLightId, data: TrafficLightLane) {
        this._id = id;
        this._data = data
    }
}

export class TrafficLightId {
    private readonly _group: number
    private readonly _lane: number

    constructor(group: number, lane: number) {
        if (!Number.isInteger(group) || !Number.isInteger(lane)) {
            throw new Error("traffic-light id exist of 2 int's");
        }
        this._group = group;
        this._lane = lane;
    }


    /**
     * Transforms a string in the `g.l` format to an id object.
     * @throws Error when the supplied string is not in the `g.l` format
     * @param string the string to pare to a valid id.
     */
    public static fromString(string: string): TrafficLightId {
        const validIdRegex = /^([1-9]+)\.([1-9]+)$/
        let match = string.match(validIdRegex);
        if (!match) {
            throw new Error("Invalid string to generate trafficLightId");
        }
        const [_, groupStr, laneStr] = match;
        return new TrafficLightId(Number.parseInt(groupStr), Number.parseInt(laneStr))
    }

    get group() {
        return this._group
    }

    get lane() {
        return this._lane
    }

    public toString = (): string => {
        return `${this._group}.${this._lane}`;
    }
}

export class SpecialSensor {
    private readonly _name: string
    private readonly _data: Sensor

    constructor(name: string, data: Sensor) {
        this._name = name;
        this._data = data
    }

    public get name() {
        return this._name
    }
}