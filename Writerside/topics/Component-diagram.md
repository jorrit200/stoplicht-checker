# Component diagram
````plantuml
@startuml
skinparam componentStyle uml2
skinparam backgroundColor #F9F9F9
skinparam componentBackgroundColor #FFFFFF
skinparam componentBorderColor #333333

component "index.ts\nMain Application" as Main #ADD8E6

component "conf.ts\nConfig Module" as Config #90EE90

component "ZMQSubCheckerBinder.ts\nBinder Module" as Binder #90EE90
component "Traffic.ts\nTraffic Module" as TrafficSvc #FFFFE0

component "Checker" #FFDAB9

component "LogConclusionAsMarkDown.ts\nLogger Module" as Logger #90EE90

() IConfig
() CheckerBinderAPI
() TrafficAPI
() LoggerAPI

Config       --- IConfig
Binder       --- CheckerBinderAPI
TrafficSvc   -- TrafficAPI
Logger       --- LoggerAPI

Main         ..( IConfig        : reads config
Main         ..( CheckerBinderAPI : sets up binder
Main         ..( TrafficAPI       : loads traffic data
Main         ..( LoggerAPI        : logs results

Binder       ..( IConfig        : get subscribe topics
Binder       ..( LoggerAPI        : resultOutput callback

Checker      ..( TrafficAPI       : Checks based on spec data
Checker      ..( CheckerBinderAPI : bound by binder

@enduml

````