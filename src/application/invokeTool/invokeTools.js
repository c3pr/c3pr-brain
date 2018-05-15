const axios = require('axios');
const filterFilesWithExtensions = require('./filterFilesWithExtensions');
const c3prLOG = require("node-c3pr-logger");

const decideApplicableToolAgents = require('./decideApplicableToolAgents');

/**
 * NOTE: files will be changed_files[if ChangesCommitted] or unmodified_files[if ToolInvocationCompleted]
 *
 * - Fetch all available tool agents
 * - From the files array (FUTURE: and project configuration) enumerate which tool agents are eligible
 * - Pick one tool agent
 * - Create ToolInvocationRequested for such tool agent.
 */
async function invokeTools({repository, files}) {
    const logMeta = {nodeName: 'c3pr-brain', moduleName: 'invokeTools'};

    /**
     * @type {Object[]}
     */
    const applicableToolAgents = decideApplicableToolAgents(files);

    c3prLOG(`Applicable tools - ${applicableToolAgents.length}: ${JSON.stringify(applicableToolAgents.map(tool => tool.toolId))}`, logMeta);

    const toolsApplied = [];
    let changedAndNotRefactoredFiles = [...files];
    for (let tool of applicableToolAgents) {

        /**
         * @type {Object[]}
         */
        const filesForThisTool = filterFilesWithExtensions(changedAndNotRefactoredFiles, tool.extensions);
        if (filesForThisTool.length === 0) {
            continue;
        }
        try {
            c3prLOG(`Invoking agent ${tool.toolId} at ${tool.agentURL} on changes to ${repository.url}, files: ${JSON.stringify(filesForThisTool)}`, {tool}, logMeta);
            let response = await axios.post(tool.agentURL, {
                 repository: repository,
                files: filesForThisTool,
                tool: tool
            });

            if (response.status === 200) {
                c3prLOG(`Invocation complete. Diff has been generated by ${tool.toolId}. No additional tools will be applied.`, {tool}, logMeta);
                toolsApplied.push({toolId: tool.toolId, diff: true, files: response.data.files});
                if (!response.data.files) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('invokeTools: response from server/toolInvocation was 200 but did not include changed file list!\nresponse: ' + require('util').inspect(response));
                }
                changedAndNotRefactoredFiles = changedAndNotRefactoredFiles.filter(f => !response.data.files.includes(f));
            } else {
                c3prLOG(`Invocation complete. No diff has been generated by ${tool.toolId}. Proceeding to the next applicable tool (if exists).`, {tool}, logMeta);
                toolsApplied.push({toolId: tool.toolId, diff: false, files: []});
            }

        } catch (e) {
            c3prLOG(`Error while invoking agent.
                * URL: ${tool.agentURL}
                * Error:
                -----------------------\n
                ${require('util').inspect(e)}
                -----------------------\n\n`, logMeta);
        }

    }

    return toolsApplied;
}

module.exports = {
    c3prBrain: {
        invokeTools
    }
};