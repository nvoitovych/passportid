<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { searchDocuments, getUniqueCountries } from '$lib/utils/documentSearch';
	import { selectedDocument } from '$lib/stores/documentStore';
	import type { Document, DocumentSearchFilters } from '$lib/types/document';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import DocumentPicker from '$lib/components/DocumentPicker.svelte';
import StepLayout from '$lib/components/StepLayout.svelte';
import StepActionBar from '$lib/components/StepActionBar.svelte';
import SearchSelect from '$lib/components/SearchSelect.svelte';

	let selectedCountry = '';
	let selectedType = '';
	let filteredDocuments: Document[] = [];
	let selectedDoc: Document | null = null;

const countries = getUniqueCountries();
	const countryOptions = [
		{ label: 'All Countries', value: '' },
		...countries.map((country) => ({
			label: country.name,
			value: country.code
		}))
	];

const documentTypes = [
		{ value: '', label: 'All Types' },
		{ value: 'passport', label: 'Passport' },
		{ value: 'id', label: 'ID Card' },
		{ value: 'visa', label: 'Visa' },
		{ value: 'drivers-license', label: "Driver's License" },
		{ value: 'other', label: 'Other' }
	];
	const typeOptions = documentTypes.map((type) => ({
		label: type.label,
		value: type.value
	}));

type FilterOption = {
	label: string;
	value: string;
};

const documentFieldId = 'document-picker';
const countryFieldId = 'country-select';
const typeFieldId = 'type-select';

	function updateFilters() {
		const filters: DocumentSearchFilters = {};
		if (selectedCountry) filters.country = selectedCountry;
		if (selectedType) filters.type = selectedType as Document['type'];
		filteredDocuments = searchDocuments(filters);
	}

	function handleDocumentSelect(event: CustomEvent<Document | null>) {
		selectedDoc = event.detail;
		if (event.detail) {
			selectedDocument.set(event.detail);
		} else {
			selectedDocument.set(null);
		}
	}

	function proceedToPhoto() {
		if (selectedDoc) {
			goto('/create/photo');
		}
	}

	function resetFilters() {
		selectedCountry = '';
		selectedType = '';
		selectedDoc = null;
		selectedDocument.set(null);
		updateFilters();
	}

	function handleCountrySelect(event: CustomEvent<FilterOption | null>) {
		// If null (cleared), reset to "All Countries" (empty value)
		if (event.detail === null) {
			selectedCountry = '';
		} else {
			selectedCountry = event.detail.value;
		}
		updateFilters();
	}

	function handleTypeSelect(event: CustomEvent<FilterOption | null>) {
		// If null (cleared), reset to "All Types" (empty value)
		if (event.detail === null) {
			selectedType = '';
		} else {
			selectedType = event.detail.value;
		}
		updateFilters();
	}

	$: {
		updateFilters();
	}

	onMount(() => {
		updateFilters();
	});
</script>

<svelte:head>
	<title>Select Document - PassportID</title>
</svelte:head>

<StepLayout currentStep={1} title="Select Document & View Requirements" showBack={false} onReset={resetFilters}>
	<div class="grid lg:grid-cols-3 gap-8 pb-24">
		<!-- Filters -->
		<div class="lg:col-span-1">
			<Card>
				<h2 class="text-xl font-medium mb-4">Filters</h2>
				
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-2" for={documentFieldId}>Document</label>
						{#key selectedDoc}
							<DocumentPicker
								documents={filteredDocuments}
								selectedDocument={selectedDoc}
								placeholder="Search and select a document..."
								inputId={documentFieldId}
								on:select={handleDocumentSelect}
							/>
						{/key}
					</div>
					
					<div>
						<label class="block text-sm font-medium mb-2" for={countryFieldId}>Country</label>
						<SearchSelect
							options={countryOptions}
							value={selectedCountry}
							placeholder="All Countries"
							inputId={countryFieldId}
							clearable={true}
							on:select={handleCountrySelect}
						/>
					</div>

					<div>
						<label class="block text-sm font-medium mb-2" for={typeFieldId}>Type</label>
						<SearchSelect
							options={typeOptions}
							value={selectedType}
							placeholder="All Types"
							inputId={typeFieldId}
							clearable={true}
							on:select={handleTypeSelect}
						/>
					</div>
				</div>
			</Card>
		</div>

		<!-- Requirements & CTA - Always Visible -->
		<div class="lg:col-span-2">
			{#if selectedDoc}
				<div class="sticky top-8">
					<Card>
						<h2 class="text-xl font-medium mb-4">Document Requirements</h2>
						
						<div class="space-y-4">
							<div>
								<h3 class="font-semibold mb-1">{selectedDoc.name}</h3>
								<p class="text-sm text-muted-foreground">
									{selectedDoc.description}
								</p>
							</div>

							<div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
								<div>
									<p class="text-xs text-muted-foreground mb-1">Size</p>
									<p class="text-sm font-medium">
										{selectedDoc.requirements.width} × {selectedDoc.requirements.height}px
									</p>
								</div>
								<div>
									<p class="text-xs text-muted-foreground mb-1">DPI</p>
									<p class="text-sm font-medium">{selectedDoc.requirements.dpi}</p>
								</div>
								<div>
									<p class="text-xs text-muted-foreground mb-1">Background</p>
									<p class="text-sm font-medium capitalize">{selectedDoc.requirements.background}</p>
								</div>
								{#if selectedDoc.requirements.minHeadSize}
									<div>
										<p class="text-xs text-muted-foreground mb-1">Min Head Size</p>
										<p class="text-sm font-medium">{selectedDoc.requirements.minHeadSize}%</p>
									</div>
								{/if}
							</div>

							{#if selectedDoc.tips && selectedDoc.tips.length > 0}
								<div class="pt-3 border-t border-border">
									<p class="text-sm font-medium mb-2">Tips</p>
									<ul class="list-disc list-inside space-y-1 text-xs text-muted-foreground">
										{#each selectedDoc.tips as tip}
											<li>{tip}</li>
										{/each}
									</ul>
								</div>
							{/if}

						</div>
					</Card>
				</div>
			{:else}
				<Card>
					<div class="text-center py-12">
						<svg
							class="w-16 h-16 mx-auto text-muted-foreground mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p class="text-muted-foreground text-sm">
							Select a document to view requirements
						</p>
					</div>
				</Card>
			{/if}
		</div>
	</div>
	
	<!-- Primary Action Bar -->
	<StepActionBar
		primaryAction={{
			label: 'Continue to Photo',
			onClick: proceedToPhoto,
			disabled: !selectedDoc
		}}
	/>
</StepLayout>

