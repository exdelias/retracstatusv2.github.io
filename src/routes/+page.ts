import { loadStatusReport } from '$lib/metrics';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const reports = loadStatusReport();
	return {
		statusLog: reports
	};

	error(404, 'Not found');
};
