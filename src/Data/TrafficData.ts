export interface TrafficData {
    groups: [keyof string, TrafficLightGroup],
    sensors: [keyof string, Sensor]
}

export interface TrafficLightGroup {
    intersects_with: number[],
    is_inverse_of: false|number,
    extends_top: false|number[],
    vehicle_type: Vehicle[],
    lanes: [keyof string, TrafficLightLane],
    is_physical_barrier: boolean,
}

export interface TrafficLightLane {
    is_inverse_of: string|undefined,
    extends_to: string|undefined,
}

export interface Sensor {
    "vehicles": Vehicle[]
}

export type Vehicle = "car"|"bike"|"walk"|"boat"