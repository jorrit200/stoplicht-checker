import {TopicCheckerConclusion} from "./ZMQSubCheckerBinder";
import {promises as fs} from 'fs';
import * as path from 'path';

export const LogConclusionAsMarkDown = async (conclusion: TopicCheckerConclusion): Promise<void> => {
    const output = `./output/${conclusion.topic}/${conclusion.timestamp}.md`
    const outputDir = path.dirname(output);

    await fs.mkdir(outputDir, { recursive: true });


    const style =
        "<style>" +
            ".admonition {" +
                "border-left: 6px solid #333;" +
                "background-color: #888;" +
                "padding: 10px 15px;" +
                "margin: 15px 0;" +
                "border-radius: 5px;" +
                "opacity: 0.8" +
            "}" +
            ".admonition.info {" +
                "border-color: #1166ee;" +
                "background-color: #333388;" +
            "}" +
            ".admonition.error {" +
                "border-color: #f44343;" +
                "background-color: #833;" +
            "}" +
            ".admonition:hover {" +
                "opacity: 1" +
            "}" +
        "</style>"
    ;

    await fs.writeFile(output, style + '\n');

    await fs.appendFile(output, '# ' + conclusion.topic + '\n');
    const conclusionDate = new Date(conclusion.timestamp);
    await fs.appendFile(output,
        conclusionDate.toDateString() +
        ' | ' +
        conclusionDate.toTimeString() +
        '\n\n'
    )

    await fs.appendFile(output, "Message:\n")
    const messageJsonEmbed = writeJson(conclusion.message);
    await fs.appendFile(output, messageJsonEmbed);

    await fs.appendFile(output, writeAdmonition("info", "Dit bericht is parsed/deserialized en daarna weer serialized, " +
        "bericht structuur hoeft dus nier overeen te komen met het origineel."))

    await fs.appendFile(output, "\n\n");
    for (const res of conclusion.results) {
        await fs.appendFile(
            output, '## ' + res.checker.method.name +
            ' ' + (res.result.isOk ? '✅' : '❌') + '\n\n'
        );
        if (!res.result.isOk) {
            await fs.appendFile(output, writeAdmonition("error", "**Protocol breuk:** dat deze test niet passed betekent dat " +
                "dit bericht niet voldoet aan het protocol. " +
                "Raadpleeg [de spec](https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/topics/" + conclusion.topic + ") " +
                "en lees de errors hieronder, om aan deze eisen te voldoen.") +
                "\n\n"
            )
            for (const feedback of res.result.feedback) {
                await fs.appendFile(output, writeAdmonition("error", feedback) + '\n');
            }
        }
        await fs.appendFile(output, '\n\n')
    }
}

const writeJson = (obj: {}): string => {
    return writeCodeBlock('json', JSON.stringify(obj, null, 2))
}

const writeCodeBlock = (lang: string, code: string): string => {
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
}

const writeAdmonition = (type: "error"|"warning"|"info", content: string): string => {
    return `-<div class="admonition ${type}">${content}</div>`;
}