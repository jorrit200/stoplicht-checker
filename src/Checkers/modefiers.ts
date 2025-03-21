import {TopicCheckerResult} from "../Service/ZMQSubCheckerBinder";
import {Traffic} from "../Service/Traffic";

export const useTraffic = <T>(
    checker: (message: T, traffic: Traffic) => TopicCheckerResult,
    traffic: Traffic
):
    (message: T) => TopicCheckerResult => {
    return (message: T) => {
        return checker(message, traffic)
    }
}