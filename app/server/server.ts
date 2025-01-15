import Fastify from 'fastify';
require("dotenv").config();
import { configs }  from '../config';

const server = Fastify();

server.get('/healthcheck', async (request, reply) => {
    return { status: true };
});

export const start = async () => {
    try {
        await server.listen({ port: configs.api.port ?? 3000 });
        console.log('Server is running at http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};