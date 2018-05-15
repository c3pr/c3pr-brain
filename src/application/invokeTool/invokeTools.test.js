require("node-c3pr-logger").testMode();
process.env.NODE_ENV = 'test';

const expect = require('chai').expect;
require('chai').should();

const decideApplicableToolAgents = require('./decideApplicableToolAgents');
decideApplicableToolAgents.__shuffleArray = a => a; // shuffleArray won't shuffle a thing

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const axiosMock = new MockAdapter(axios);

const toolAgents = require('../../toolAgents');

const config = require('../../config');
config.c3pr.patchesUrl = 'http://changes-server/patches';

require("node-c3pr-logger").testMode();

const invokeTools = require('./invokeTools').c3prBrain.invokeTools;

describe('invokeTools', () => {

    const changes = {
        changed_files: ['src/main/a/b/c/Main.java', 'src/main/a/b/c/Main.js', 'src/boo.txt'],
        repository: {
            url: "https://github.com/org/repo.git",
            branch: "my-branch-name",
            revision: "4444eedacc076e8a16ae565b535fd48edb9a044a"
        }
    };

    it('should issue a post to each tool with extensions on changed_files files', async () => {

        toolAgents.agents = [
            {toolId: "one", extensions: ["java", "js"], agentURL: "http://one", command: "one command", toolMeta: {rule: "one"}, prTitle: "prTitle one", prBody: `prBody one`},
            {toolId: "two", extensions: ["js"], agentURL: "http://two", command: "two command", toolMeta: {rule: "two"}, prTitle: "prTitle two", prBody: `prBody two`},
        ];

        const repository = changes.repository;

        axiosMock.onPost(toolAgents.agents[0].agentURL, {
            repository,
            files: [changes.changed_files[0], changes.changed_files[1]],
            tool: toolAgents.agents[0]
        }).reply(204, {}, {'content-type': 'application/json'}); // calls on tool 'one' never produce diff

        axiosMock.onPost(toolAgents.agents[1].agentURL, {
            repository,
            files: [changes.changed_files[1]],
            tool: toolAgents.agents[1]
        }).reply(200, {files: [changes.changed_files[1]]}, {'content-type': 'application/json'}); // calls on tool 'two' produces diff

        // execute
        let toolsApplied = await invokeTools({repository: changes.repository, files: changes.changed_files});

        // verify
        expect(toolsApplied[0]).to.deep.equal({ toolId: 'one', diff: false, files: []});
        expect(toolsApplied[1]).to.deep.equal({ toolId: 'two', diff: true, files: [changes.changed_files[1]]}); // should aways stop on 'two'
        expect(toolsApplied.length).to.equal(2);
    });

    it('should not send file forward if it was modified by previous tool invocation', async () => {

        toolAgents.agents = [
            {toolId: "one", extensions: ["java", "js"], agentURL: "http://one", command: "one command", toolMeta: {rule: "one"}, prTitle: "prTitle one", prBody: `prBody one`},
            {toolId: "two", extensions: ["java", "js"], agentURL: "http://two", command: "two command", toolMeta: {rule: "two"}, prTitle: "prTitle two", prBody: `prBody two`},
        ];

        const repository = changes.repository;

        axiosMock.onPost(toolAgents.agents[0].agentURL, {
            repository,
            files: [changes.changed_files[0], changes.changed_files[1]],
            tool: toolAgents.agents[0]
        }).reply(200, {files: [changes.changed_files[0]]}, {'content-type': 'application/json'}); // calls on tool 'one' changes only one file, so the other tool can be invoked in the remaining one

        axiosMock.onPost(toolAgents.agents[1].agentURL, {
            repository,
            files: [changes.changed_files[1]],
            tool: toolAgents.agents[1]
        }).reply(200, {files: [changes.changed_files[1]]}, {'content-type': 'application/json'}); // calls on tool 'two' changes the other file

        // execute
        let toolsApplied = await invokeTools({repository: changes.repository, files: changes.changed_files});

        // verify
        expect(toolsApplied[0]).to.deep.equal({ toolId: 'one', diff: true, files: [changes.changed_files[0]]});
        expect(toolsApplied[1]).to.deep.equal({ toolId: 'two', diff: true, files: [changes.changed_files[1]]});
        expect(toolsApplied.length).to.equal(2);
    });

});
