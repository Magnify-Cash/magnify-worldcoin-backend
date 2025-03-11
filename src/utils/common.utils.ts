
import { mkConfig, generateCsv, download } from 'export-to-csv'

const csvConfig = mkConfig({ useKeysAsHeaders: true });

export function exportCSV(data: any[]) {
    const csv = generateCsv(csvConfig)(data);
    return csv;
}