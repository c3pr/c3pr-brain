process.env.NODE_ENV = 'test';

const invokeTools = require('./invokeTools');
const sinon = require('sinon');
require('chai').should();
const request = require('request');
const toolAgents = require('./toolAgents');
const RESPONSE_OK = {statusCode: 200, headers: {'content-type': 'application/json'}};




describe('invokeTools', () => {

    const pushedChange = {
        changeset: ['src/main/a/b/c/Main.java', 'src/main/a/b/c/Main.js'],
        repository: {
            type: "git",
            url: "https://github.com/org/repo.git",
            revision: "123rev"
        }
    };
    toolAgents.agents = [
        {name: "one", extensions: ["java"], agentURL: "http://one", arguments: {rule: "one"}},
        {name: "two", extensions: ["js"], agentURL: "http://two", arguments: {rule: "two"}}
    ];




    let responseBody;
    beforeEach(() => {
        responseBody = {
            that: 'is it!'
        };
        this.post = sinon.stub(request, 'post');
    });

    afterEach(() => {
        request.post.restore();
    });

    it('should issue a post to each tool with extensions on changeset files', () => {
        this.post.yields(null, RESPONSE_OK, JSON.stringify(responseBody));

        invokeTools(pushedChange);

        sinon.assert.calledTwice(this.post);
        sinon.assert.calledWith(this.post,
            toolAgents.agents[0].agentURL,
            {
                repository: pushedChange.repository,
                files: [pushedChange.changeset[0]],
                arguments: toolAgents.agents[0].arguments
            }
        );
        sinon.assert.calledWith(this.post,
            toolAgents.agents[1].agentURL,
            {
                repository: pushedChange.repository,
                files: [pushedChange.changeset[1]],
                arguments: toolAgents.agents[1].arguments
            }
        );
    });

});

