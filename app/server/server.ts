import Fastify from 'fastify';

export const server = Fastify();

server.get('/', async (request, reply) => {
    return { status: true };
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log('Server is running at http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();