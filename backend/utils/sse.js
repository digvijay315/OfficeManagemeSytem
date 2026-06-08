let clients = [];

const addClient = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const userId = req.user ? req.user._id.toString() : null;
    const role = req.user ? req.user.role : null;

    const newClient = {
        id: clientId,
        userId,
        role,
        res
    };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
};

const sendToAdmins = (event, data) => {
    clients.filter(c => c.role === 'admin').forEach(c => {
        c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
};

const sendToUser = (userId, event, data) => {
    if (!userId) return;
    clients.filter(c => c.userId === userId.toString()).forEach(c => {
        c.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
};

// Kept sendEvent for backward compatibility during refactor, pointing to sendToAdmins
module.exports = { addClient, sendToAdmins, sendToUser, sendEvent: sendToAdmins };
