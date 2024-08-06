import reports from '$lib/logs.json';
import { StatusCode, type ReportFile, type Status } from '$lib/types';
import moment from 'moment';

export function loadStatusReport(): Array<[string, Status[]]> {
	// We generate the array that we will use
	const statusReport: Array<[string, Status[]]> = [];

	// We iterate over every site's reports
	for (const report of reports.site) {
		// Create the nested array object
		const siteLogs: Status[] = [];

		// We want to sort the dates from latest to oldest
		const logs = report.status.sort((date1, date2) => date2.timestamp - date1.timestamp);

		// We fetch the first date and first status and use that as our starting point
		let current: [moment.Moment, StatusCode] = [
			moment.unix(logs[0].timestamp),
			logs[0].result ? 0 : 1
		];

		// We start on index 1 as we already have index 0
		for (let i = 1; i < logs.length; i++) {
			const event = logs[i];

			// We first check if the following event happened less than 24 hours from the current event
			// We compare the current date to the end of the next event's day (to ensure that it happened in the same day)
			if (Math.abs(moment.unix(event.timestamp).startOf('day').diff(current[0], 'hours')) < 24) {
				const [, currentStatus] = current;
				// If it happened in the same day, we check if the status is different:
				// Unless that we have an error, if so we report the error as existing at EOD
				if (currentStatus !== StatusCode.ERROR && currentStatus !== (event.result ? 0 : 1)) {
					// If the currentStatus was OK, but the new event is not OK, we set as unstable because it got fixed
					// (The `event` object is an event that happened BEFORE the current status so the event was fixed)
					if (currentStatus === StatusCode.OK) {
						current[1] = StatusCode.UNSTABLE;
					}
					// For any other case we will keep the event from EOD
				}
			} else {
				const [currentDay, currentStatus] = current;
				// If the event happened with more than 24 hours from the start of day, we push the old date
				siteLogs.push({ status: currentStatus, date: currentDay.toDate() });

				// We update the date to the current one
				current = [moment.unix(event.timestamp), event.result ? 0 : 1];
			}
		}

		// Once the loop is over, we want to push the last day that never got push
		siteLogs.push({ status: current[1], date: current[0].toDate() });

		// And we add this array to the dictionary with the site's name
		statusReport.push([report.name, siteLogs.reverse()]);
	}
	return statusReport;
}

export function loadIncidents(): ReportFile['incidents'] {
	return reports.incidents;
}
