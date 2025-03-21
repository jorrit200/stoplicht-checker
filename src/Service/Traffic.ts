import {TrafficData, TrafficLightGroup, TrafficLightLane} from "../Data/TrafficData";

export class Traffic {
    private readonly _data: TrafficData

    constructor(data: TrafficData) {
        this._data = data
    }

    getAllIds() {
        return Object.keys(this._data.groups)
            .flatMap((g) => Object.keys(this._data.groups[g].lanes)
                .map(l => `${g}.${l}`))
    }
}

export class TrafficGroup {
    private readonly _id: number
    private readonly _data: TrafficLightGroup

    constructor(groupId: number, data: TrafficLightGroup) {
        this._id = groupId;
        this._data = data
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