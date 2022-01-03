export interface ReportListGroupData {
	name: string;
	totalTime: number;
	hex?: string;
	data: ReportListItem[];
}

export interface ReportListItem {
	name: string;
	totalTime: number;
	hex?: string;
	count?: number;
}

export interface ProjectSummaryItem {
	hex: string;
	title: string;
	client_title?: string;
	totalTime: string;
	percent: number;
}
