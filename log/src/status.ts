import { ActionLogger } from "./github/types";
import axios, { AxiosError } from "axios";

export class StatusChecker {
    constructor(private readonly siteName: string, private readonly healthEndpoint: string,
        private readonly logger: ActionLogger) {
        logger.info(`Created Status Checker for ${siteName}`);
    }

    async verifyEndpoint(): Promise<boolean> {
        try {
            this.logger.info(`Contacting ${this.siteName}`);
            const request = await axios.get(this.healthEndpoint);
            this.logger.debug(`Contacted ${this.healthEndpoint} with status ${request.status}`);
            return request.status >= 200 && request.status < 300;
        } catch (err: unknown | Error | AxiosError) {
            if (axios.isAxiosError(err)) {
                const axErr = err as AxiosError;
                this.logger.error(`Failed to contact ${this.siteName} with status ${axErr.status}`);
                this.logger.debug(JSON.stringify(axErr.toJSON()));
            } else {
                this.logger.error("Failed with unknown error");
                this.logger.debug(JSON.stringify(err));
            }
        }
        return false;
    }
}
