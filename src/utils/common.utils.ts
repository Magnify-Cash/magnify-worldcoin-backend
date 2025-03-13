import { mkConfig, generateCsv } from 'export-to-csv'

const csvConfig = mkConfig({ useKeysAsHeaders: true });

export function exportCSV(data: any[], filename: string = 'export.csv') {
    const csv = generateCsv(csvConfig)(data);
    
    // Generate a timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filenameWithTimestamp = `${filename.replace('.csv', '')}_${timestamp}.csv`;
    
    return {
        csv: csv.toString(),
        filename: filenameWithTimestamp
    };
}

export function convertTimestampToDate(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return date.toISOString();
}