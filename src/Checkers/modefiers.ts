import {TopicCheckerResult} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";


/**
 * Turns a method that takes a message and a traffic object,
 * into a method that only takes a message object and holds a cached version of the traffic-data
 * The returned method adheres to the TopicChecker interface, so it can be used with the topic binder.
 * @param checker Checker method that takes 2 parameters.
 * @param traffic The traffic data that will be used by the returned method.
 * @return A method that only takes a message object, and so adheres to the TopicChecker interface.
 */
export const useTraffic = <T>(
    checker: (message: T, traffic: Traffic) => TopicCheckerResult,
    traffic: Traffic
):
    (message: T) => TopicCheckerResult => {
    return (message: T) => {
        return checker(message, traffic)
    }
}