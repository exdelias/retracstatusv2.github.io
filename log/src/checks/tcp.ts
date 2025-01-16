import * as net from 'net';
import { ActionLogger } from "../github/types";

function attemptConnection(host: string, port: number, logger: ActionLogger, retryCount: number = 5): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;

    function attemptConnection() {
      const socket = new net.Socket();

      // Set a timeout for the connection attempt
      socket.setTimeout(1000);

      // Attempt to connect to the specified host and port
      socket.on('connect', () => {
        // If connected, destroy the socket and resolve true
        socket.removeAllListeners();  // Clean up listeners
        socket.destroy();
        resolve(true);

      });

      // Handle errors that occur during the connection attempt
      socket.on('error', (err) => {
        logger.error(`Connection error: ${err.message}`);
        socket.removeAllListeners();
        socket.destroy();
        // If it's anything other then a connection refused, retry
        if (!err.message.includes("ECONNREFUSED")) {
            handleRetry();
        }
      });

      // Handle timeout scenario
      socket.on('timeout', () => {
        logger.error('Connection timeout');
        socket.destroy();
        resolve(false);
      });

      function handleRetry() {
        if (attempts < retryCount) {
          attempts += 1;
          logger.log(`Retrying... (${attempts}/${retryCount})`);
          setTimeout(attemptConnection, 500); // Retry after .5 seconds
        } else {
          resolve(false); // Failed after retrying
        }
      }

      socket.connect(port, host);
    }

    attemptConnection();

  });
}

export class TCPChecker {
    constructor(private readonly siteName: string, private readonly healthEndpoint: string,
        private readonly logger: ActionLogger) {
        this.logger.info(`Created Status Checker for ${siteName}`);
    }

    async verifyEndpoint(): Promise<boolean> {
        const [host, portString] = this.healthEndpoint.replace('tcp://', '').split(':');
        if (!host) {
            this.logger.error('Invalid host: Host cannot be empty');
            return false;
        }

        // Convert the port part to a number
        const port = parseInt(portString, 10);
        if (Number.isNaN(port) || port < 1 || port > 65535) {
            this.logger.error(`Invalid port number: ${portString}`);
            return false;
        }

        try {
            const isConnected = await attemptConnection(host, port, this.logger);
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
