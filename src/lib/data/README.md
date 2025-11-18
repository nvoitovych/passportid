# Document Requirements Data

This directory contains the unified document requirements configuration file.

## File Structure

- `requirements-config.json` - Main configuration file with all document requirements
  - Contains requirements for passports, IDs, visas, and other documents
  - Uses unified format with all necessary fields for UI and validation
  - Used directly without conversion

## Data Format

The configuration uses a unified format that includes:

- **Basic requirements**: `width`, `height`, `dpi`, `background`
- **Head size requirements**: 
  - `headHeightMM: [min, max]` - Head height range in millimeters
  - `headHeightPerc: [min, max]` - Head height range in percentage
  - `minHeadSize` - Minimum head size as percentage (for backward compatibility)
- **Head position guidelines** (for UI display):
  - `headPosition.top` - Top boundary where head should start (percentage from top)
  - `headPosition.bottom` - Bottom boundary where head should end (percentage from top)
  - `headPosition.eyeLineMM: [min, max]` - Eye line distance from bottom in millimeters

See `docs/requirements-config-docs.md` for detailed documentation on the data structure.

## Usage

The data is loaded directly in `src/lib/utils/documentSearch.ts`:

```typescript
import documentsData from '$lib/data/requirements-config.json';
export const documents: Document[] = documentsData as Document[];
```

## Requirements Validation

All requirements from the config are used in the application:

1. **Size & DPI**: Used for cropping and export
2. **Background**: Used for background color selection
3. **Head guidelines** (`headPosition.top/bottom`): Displayed as guidelines during alignment
4. **Head size** (`headHeightPerc`, `minHeadSize`): Displayed as minimum size indicator
5. **Eye line** (`eyeLineMM`): Displayed as additional guideline when specified

## Updating Requirements

To update requirements, edit `requirements-config.json` directly. The format is self-contained and doesn't require conversion.
