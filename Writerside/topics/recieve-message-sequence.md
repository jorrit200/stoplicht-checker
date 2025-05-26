# receive message sequence

````PlantUML
@startuml
actor "ZeroMQ Publisher" as Pub
participant "Subscriber\n(zeromq)" as Sub
participant "ZMQSubCheckerBinder" as Binder
participant "TopicChecker" as Checker
participant "resultOutput\n(callback)" as Logger
participant "LogConclusionAs\nMarkDown" as LogModule
database FileSystem

== Message Arrival ==
Pub -> Sub : send(topic, rawMsg)
activate Sub

Sub -> Binder : onMessage(topic, rawMsg)
activate Binder

== Parsing ==
Binder -> Binder : JSON.parse(rawMsg)
alt parse error
    Binder -> Logger : resultOutput(errorConclusion)
else parse success
    Binder -> Binder : lookup checkers for topic
    loop for each checker
        Binder -> Checker : method(msgObj)
        activate Checker
        Checker --> Binder : TopicCheckerResult
        deactivate Checker
    end
    Binder -> Binder : assemble TopicMessageConclusion
    Binder -> Logger : resultOutput(conclusion)
end
deactivate Binder

== Logging ==
Logger -> LogModule : LogConclusionAsMarkDown(conclusion)
activate LogModule
LogModule -> FileSystem : mkdir … 
LogModule -> FileSystem : write .md file
deactivate LogModule

Sub --> Pub : (next message)
deactivate Sub
@enduml
````