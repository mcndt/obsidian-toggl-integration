export interface ReportListGroupData {
	name: string;
	totalTime: string;
	hex?: string;
	data: ReportListItem[];
}

export interface ReportListItem {
	name: string;
	totalTime: string;
	hex?: string;
	count?: number;
}
