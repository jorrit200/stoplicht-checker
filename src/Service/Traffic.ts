import {TrafficData} from "../Data/TrafficData";

export class Traffic {
    private _data: TrafficData

    constructor(data: TrafficData) {
        this._data = data
    }
}

export class TrafficLightId {
    private readonly _group: number
    private readonly _lane: number

    constructor(group: number, lane: number) {
        if (!Number.isInteger(group) || !Number.isInteger(lane)) {
            throw new Error("traffic-light id exist of 2 ints");
        }
        this._group = group;
        this._lane = lane;
    }

    get group() {return this._group}
    get lane() {return this._lane}

    public toString = (): string => {
        return `${this._group}.${this._lane}`;
}
}