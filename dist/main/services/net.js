import net from "node:net";
export function checkTcpPort(port, host = "127.0.0.1", timeoutMs = 800) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        });
        socket.once("timeout", () => {
            socket.destroy();
            resolve(false);
        });
        socket.once("error", () => resolve(false));
        socket.connect(port, host);
    });
}
