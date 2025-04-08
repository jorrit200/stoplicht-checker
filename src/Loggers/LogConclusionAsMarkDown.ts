import {TopicMessageConclusion} from "../Service/ZMQSubCheckerBinder";
import {promises as fsp} from 'fs'
import {createWriteStream} from 'fs'
import {randomUUID} from 'crypto'
import * as path from 'path'
import {promises as fs} from 'fs';
import * as path from 'path';
import {config} from "../Config/conf";

/**
 * Takes message conclusions, and writes MarkDownFiles
 * @param conclusion Passed by binder.
 */
export const LogConclusionAsMarkDown = async (conclusion: TopicMessageConclusion): Promise<void> => {
    const output = `./output/${conclusion.topic}/${conclusion.timestamp}_${randomUUID().substring(0, 5)}.md`
    if (conclusion.results.every((r) => {r.result.isOk}) && !config.get('output.log_perfect_messages')) {
        return
    }

    const output = `${config.get('output.dir')}/${conclusion.topic}/${conclusion.timestamp}.md`
    const outputDir = path.dirname(output);

    await fsp.mkdir(outputDir, {recursive: true});


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

    const stream = createWriteStream(output, {flags: 'a'});

    stream.write(style + '\n');

    stream.write('# ' + conclusion.topic + '\n');
    const conclusionDate = new Date(conclusion.timestamp);
    stream.write(conclusionDate.toDateString() +
        ' | ' +
        conclusionDate.toTimeString() +
        '\n\n'
    )

    stream.write("Message:\n")
    const messageJsonEmbed = toJsonBlock(conclusion.message);
    stream.write(messageJsonEmbed);

    stream.write(toAdmonition("info", "Dit bericht is parsed/deserialized en daarna weer serialized, " +
        "bericht structuur hoeft dus nier overeen te komen met het origineel."))

    stream.write("\n\n");
    for (const res of conclusion.results) {
        stream.write('## ' + res.checker.name +
            ' ' + (res.result.isOk ? '✅' : '❌') +
            '\n\n'
        );

        if (res.checker.checksFor == 'protocol' && !res.result.isOk) {
            stream.write(toAdmonition("error", "<strong>Protocol breuk:</strong> dat deze test niet passed betekent dat " +
                "dit bericht niet voldoet aan het protocol. " +
                "Raadpleeg <a href='https://github.com/jorrit200/stoplicht-communicatie-spec/tree/main/topics/" + conclusion.topic + "'>de specs</a> " +
                "en lees de errors hieronder, om aan deze eisen te voldoen.")
            )
        }

        stream.write(toMdParagraph(res.checker.description))

        if (!res.result.isOk) {
            stream.write(toUl(res.result.feedback
                .map(f => toAdmonition('error', f))));
        }
        stream.write('\n\n')
    }
    stream.end()
}


const toJsonBlock = (obj: {}): string => {
    return toCodeBlock('json', JSON.stringify(obj, null, 2))
}

const toCodeBlock = (lang: string, code: string): string => {
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
}

const toAdmonition = (type: "error" | "warning" | "info", content: string): string => {
    return `<div class="admonition ${type}">${content}</div> \n\n`;
}

const toUl = (items: string[]): string => {
    return items.map(item => `- ${item}`).join('\n') + '\n\n'
}

const toMdParagraph = (content: string): string => {
    return '\n\n' + content + '\n\n'
}