/**
 * Data about a traffic situation, as described in:
 * https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/intersectionData
 */
export interface TrafficData {

    /**
     * Traffic-light groups
     */
    groups: Record<string, TrafficLightGroup>,

    /**
     * The special sensors within the traffic situation, that aren’t directly related to lanes or traffic-lights.
     */
    sensors: Record<string, Sensor>
}


/**
 * A group of traffic-lights, where each traffic-light is in the same traffic-direction.
 */
export interface TrafficLightGroup {

    /**
     * The other groups that have intersections with this one.
     */
    intersects_with: number[],

    /**
     * The traffic-lane group that is the inverse of this one.
     */
    is_inverse_of: false|number,

    /**
     * The traffic-lane group you'd end up in if you were to follow this one.
     */
    extends_to: false|number[],

    /**
     * The types of vehicle that can be in this traffic-lane group.
     */
    vehicle_type: Vehicle[],

    /**
     * The individual lanes in this group,
     * where the key is the lane id (the l in `g.l`)
     * and the object is the information about the lane that differs from the information in the group.
     */
    lanes: Record<string, TrafficLightLane>,

    /**
     * Whether the traffic-lights in this group represent physical barriers,
     * such that even a defiant vehicle can’t proceed if the state of traffic-lights in this group is "rood"
     */
    is_physical_barrier: boolean,
}

/**
 * A specific lane or traffic-light.
 */
export interface TrafficLightLane {
    is_inverse_of: string|undefined,
    extends_to: string|undefined,
}

/**
 * A special sensor in a traffic situation. Specifies by which vehicles its triggered.
 */
export interface Sensor {
    "vehicles": Vehicle[]
}

/**
 * The type of "vehicle" supported by the protocol.
 * Where a "vehicle" can mean any entity that participates in the traffic situation.
 */
export type Vehicle = "car"|"bike"|"walk"|"boat"