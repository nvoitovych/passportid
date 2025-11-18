import type { Document, DocumentSearchFilters } from '$lib/types/document';
import documentsData from '$lib/data/requirements-config.json';

// Use documents directly without conversion
export const documents: Document[] = documentsData as Document[];

export function searchDocuments(filters: DocumentSearchFilters): Document[] {
	let results = [...documents];

	if (filters.country) {
		results = results.filter(
			(doc) =>
				doc.country.toLowerCase().includes(filters.country!.toLowerCase()) ||
				doc.countryCode.toLowerCase() === filters.country!.toLowerCase()
		);
	}

	if (filters.type) {
		results = results.filter((doc) => doc.type === filters.type);
	}

	if (filters.query) {
		const query = filters.query.toLowerCase();
		results = results.filter(
			(doc) =>
				doc.name.toLowerCase().includes(query) ||
				doc.country.toLowerCase().includes(query) ||
				doc.type.toLowerCase().includes(query) ||
				doc.description?.toLowerCase().includes(query) ||
				doc.source?.toLowerCase().includes(query)
		);
	}

	return results;
}

export function getDocumentById(id: string): Document | undefined {
	return documents.find((doc) => doc.id === id);
}

export function getDocumentsByCountry(countryCode: string): Document[] {
	return documents.filter((doc) => doc.countryCode === countryCode);
}

export function getUniqueCountries(): Array<{ code: string; name: string; count: number }> {
	const countryMap = new Map<string, { name: string; count: number }>();

	documents.forEach((doc) => {
		const existing = countryMap.get(doc.countryCode);
		if (existing) {
			existing.count++;
		} else {
			countryMap.set(doc.countryCode, { name: doc.country, count: 1 });
		}
	});

	return Array.from(countryMap.entries()).map(([code, data]) => ({
		code,
		...data
	}));
}
