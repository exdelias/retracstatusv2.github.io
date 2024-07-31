import { expect, test } from '@playwright/test';
import { readFile } from 'fs/promises';

const reportFile = await readFile('src/lib/logs.json', 'utf-8');
const report: { name: string }[] = JSON.parse(reportFile);

test('Verify that report is not empty', () => {
	expect(report.length).toBeGreaterThan(0);
});

report.forEach(({ name }) => {
	test(`Verifying that ${name} status is visible`, async ({ page }) => {
		await page.goto('/');

		await expect(page.getByText(name)).toBeVisible();
	});
});
