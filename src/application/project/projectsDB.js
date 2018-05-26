const uuidv4 = require('uuid/v4');

const client = require('./db');

const projects = client.then(cli => cli.db(config.c3pr.brain.c3prBrainMongoDatabase).collection(config.c3pr.brain.c3prBrainMongoCollectionProjects));

async function insert(data) {
    return (await projects).insertOne(data);
}

async function findBy(query) {
    return (await projects).find(query).toArray();
}

async function newProject({clone_url_http, name, tags}) {
    const projectOfUrl = await findBy({clone_url_http});
    if (projectOfUrl.length > 0) {
        throw new Error(`A project with URL ${clone_url_http} already exists. UUID: ${projectOfUrl[0].uuid}.`);
    }

    return insert({
        uuid: uuidv4(),
        clone_url_http,
        name,
        tags,
    });
}

module.exports = {
    newProject
};

// noinspection BadExpressionStatementJS
(() => {

newProject({
    clone_url_http: "https://gitlab.com/c3pr/sample-project-java-maven.git",
    name: 'sample-project-java-maven',
    tags: ["java", "maven"],
}).catch(console.log);
newProject({
    clone_url_http: "http://c3prgitlab:8888/sample_user/sample-project-java-maven.git",
    name: 'sample-project-java-maven',
    tags: ["java", "maven"],
}).catch(console.log);

});