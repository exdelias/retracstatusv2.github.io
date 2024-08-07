import moment from "moment";
import { ReportFile } from "../types";
import { ActionLogger, GitHubClient, Repo } from "./types";

export class IncidentManager {
    constructor(
        private readonly api: GitHubClient,
        private readonly logger: ActionLogger,
        private readonly labelName: string = "incident",

    ) { }

    async obtainPastIncidents(repo: Repo, maxAge: number): Promise<ReportFile["incidents"]> {
        this.logger.info("Searching for previous incidents")
        const issues = await this.api.rest.issues.listForRepo({ ...repo, state: "all" });
        this.logger.info(`Found ${issues.data.length} issues`);
        const incidents: ReportFile["incidents"] = []

        for (const issue of issues.data) {
            if (issue.labels.some(l => {
                if (typeof l === "string") {
                    return l.toLocaleUpperCase() === this.labelName.toLocaleUpperCase();
                } else {
                    return l.name?.toLocaleUpperCase() === this.labelName.toLocaleUpperCase();
                }
            })) {
                const creationDate = moment(issue.created_at);
                if (Math.abs(creationDate.diff(moment.now(), "days")) < maxAge) {
                    incidents.push({ date: creationDate.unix(), title: issue.title, open: issue.state === "open" });
                } else {
                    this.logger.info(`Issue ${issue.title} is older than ${maxAge} days`);
                }
            }
        }

        this.logger.info(`${incidents.length} of this issues were incidents`);

        return incidents;
    }
}
