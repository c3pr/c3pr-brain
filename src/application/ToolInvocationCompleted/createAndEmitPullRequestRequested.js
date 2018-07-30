const c3prLOG4 = require("node-c3pr-logger/c3prLOG4").default;

const createPullRequestRequested = require('../PullRequestRequested/createPullRequestRequested').c3pr.createPullRequestRequested;
const emitPullRequestRequested = require('../PullRequestRequested/emitPullRequestRequested');

const invokeToolsForRemainingFiles = require('./invokeToolsForRemainingFiles');

function createAndEmitPullRequestRequested(toolInvocationCompletedEvent, {lcid, euuid}) {
    const lms = [...(logMetas || []), {nodeName: 'c3pr-brain', correlationId: toolInvocationCompletedEvent.payload.repository.revision, moduleName: 'createAndEmitPullRequestRequested'}];

    let result = {};
    if (toolInvocationCompletedEvent.payload.unmodified_files.length) {
        c3prLOG4(`ToolInvocationCompleted has unmodified files. I will now attempt to invoke new tools.`, {lcid, euuid, meta: {toolInvocationCompletedEvent}});
        result.newToolInvocation = invokeToolsForRemainingFiles(toolInvocationCompletedEvent, {lcid, euuid});
    }

    if (toolInvocationCompletedEvent.payload.changed_files.length) {
        c3prLOG4(`ToolInvocationCompleted modified files. I will now issue a PullRequestRequested event.`, {lcid, euuid, meta: {toolInvocationCompletedEvent}});
        const pullRequestRequested = createPullRequestRequested(toolInvocationCompletedEvent);
        result.prEmitted = emitPullRequestRequested(pullRequestRequested, lms);
    }

    return {new_status: 'PROCESSED', result};
}

module.exports = createAndEmitPullRequestRequested;
