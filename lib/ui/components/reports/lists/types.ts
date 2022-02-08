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
	/** Defines the ordering in the group. (e.g. derive from time) */
	order?: number;
	tags?: string[];
	project?: string;
}

export interface ProjectSummaryItem {
	hex: string;
	title: string;
	client_title?: string;
	totalTime: string;
	percent: number;
}
