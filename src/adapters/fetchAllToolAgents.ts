import axios from 'axios';
import config from '../config';

async function fetchAllToolAgents() {
    const headers = {Authorization: `Bearer ${config.c3pr.auth.jwt}`};

    let {data: toolAgents} = await axios.get(config.c3pr.hub.agentsUrl, {headers});
    return toolAgents;
}

export default fetchAllToolAgents;