import {UpdatePrefsCommand} from "./ProjectPreferences";
import genPrefsFromCCs from "./genPrefsFromCCs";
import genPrefsFromPRCs from "./genPrefsFromPRCs";
import genPrefsFromPRUs from "./genPrefsFromPRUs";
import genPrefsFromPPUs from "./genPrefsFromPPUs";

export default async function genPrefsFromEvents(clone_url_http: string): Promise<UpdatePrefsCommand[]> {
    const ccs = await genPrefsFromCCs(clone_url_http);
    const prcs = await genPrefsFromPRCs(clone_url_http);
    const prus = await genPrefsFromPRUs(clone_url_http);
    const ppus = await genPrefsFromPPUs(clone_url_http);

    const commands = [...ccs, ...prcs, ...prus, ...ppus];
    commands.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return commands;
}