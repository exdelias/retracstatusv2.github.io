import * as net from 'net';
import { ActionLogger } from "../github/types";

function attemptConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    // Set a timeout for the connection attempt
    socket.setTimeout(1000);

    // Attempt to connect to the specified host and port
    socket.connect(port, host, () => {
      // If connected, destroy the socket and resolve true
      socket.destroy();
      resolve(true);
    });

    // Handle errors that occur during the connection attempt
    socket.on('error', (err) => {
      console.error('Connection error:', err.message);
      socket.destroy();
      resolve(false);
    });

    // Handle timeout scenario
    socket.on('timeout', () => {
      console.error('Connection timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

export class TCPChecker {
    constructor(private readonly siteName: string, private readonly healthEndpoint: string,
        private readonly logger: ActionLogger) {
        this.logger.info(`Created Status Checker for ${siteName}`);
    }

    async verifyEndpoint(): Promise<boolean> {
        const [host, portString] = this.healthEndpoint.replace('tcp://', '').split(':');

        // Convert the port part to a number
        const port = parseInt(portString, 10);

        try {
            const isConnected = await attemptConnection(host, port);
        if (isConnected) {
            this.logger.info('Connection successful');
            return true;
        } else {
            this.logger.info('Connection failed');
            return false;
        }
      } catch (error) {
            this.logger.error('Error during connection attempt: ' + error);
            return false;
      }
    }
}
