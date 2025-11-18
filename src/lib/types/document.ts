// Unified document structure - used directly without conversion
export interface Document {
	id: string;
	country: string;
	countryCode: string;
	type: 'passport' | 'id' | 'visa' | 'drivers-license' | 'other';
	name: string;
	description?: string;
	source?: string;
	requirements: {
		width: number;
		height: number;
		dpi: number;
		background: 'white' | 'colored' | 'transparent';
		// Head size requirements
		headHeightMM?: [number, number]; // Head height range in millimeters [min, max]
		headHeightPerc?: [number, number]; // Head height range in percentage [min, max]
		minHeadSize?: number; // Minimum head size as percentage (for backward compatibility, can be derived from headHeightPerc[0])
		// Head position requirements for guidelines
		headPosition?: {
			// Guidelines position (in percentage from top of photo)
			top?: number; // Top boundary where head should start
			bottom?: number; // Bottom boundary where head should end
			left?: number;
			right?: number;
			// Eye line position (in millimeters from bottom of photo)
			eyeLineMM?: [number, number]; // Eye line distance from bottom [min, max]
		};
	};
	tips?: string[];
}

export interface DocumentSearchFilters {
	country?: string;
	type?: Document['type'];
	query?: string;
}
