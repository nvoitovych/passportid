<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { documents, searchDocuments } from '$lib/utils/documentSearch';
	import type { Document, DocumentSearchFilters } from '$lib/types/document';
	import Input from '$lib/components/Input.svelte';

	let searchQuery = '';
	let filteredDocuments: Document[] = documents;

	function updateSearch() {
		const filters: DocumentSearchFilters = {};
		if (searchQuery) filters.query = searchQuery;
		
		// Check for country filter from URL
		const countryCode = $page.url.searchParams.get('country');
		if (countryCode) {
			filters.country = countryCode;
		}
		
		filteredDocuments = searchDocuments(filters);
	}

	// Reactively update search when query changes
	$: if (searchQuery !== undefined) {
		updateSearch();
	}

	onMount(() => {
		// Set initial search query if country is in URL
		const countryCode = $page.url.searchParams.get('country');
		if (countryCode) {
			// Find country name to show in search
			const countryDoc = documents.find((d) => d.countryCode === countryCode);
			if (countryDoc) {
				searchQuery = countryDoc.country;
			}
		}
		updateSearch();
	});
</script>

<svelte:head>
	<title>Documents - PassportID</title>
</svelte:head>

<div class="container py-12">
	<h1 class="text-4xl font-bold mb-8">All Documents</h1>

	<div class="mb-6">
		<Input
			placeholder="Search documents by name, country, or type..."
			bind:value={searchQuery}
		/>
	</div>

	<div class="overflow-x-auto">
		<table class="w-full border-collapse">
			<thead>
				<tr class="border-b border-border">
					<th class="text-left py-3 px-4 font-medium">Name</th>
					<th class="text-left py-3 px-4 font-medium">Country</th>
					<th class="text-left py-3 px-4 font-medium">Type</th>
					<th class="text-left py-3 px-4 font-medium">Size</th>
					<th class="text-left py-3 px-4 font-medium">DPI</th>
					<th class="text-left py-3 px-4 font-medium">Background</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredDocuments as doc}
					<tr class="border-b border-border/50 hover:bg-secondary/50">
						<td class="py-3 px-4">
							<a
								href="/create/select-document?doc={doc.id}"
								class="text-primary hover:text-primary/80"
							>
								{doc.name}
							</a>
						</td>
						<td class="py-3 px-4">{doc.country}</td>
						<td class="py-3 px-4 capitalize">{doc.type.replace('-', ' ')}</td>
						<td class="py-3 px-4">
							{doc.requirements.width} × {doc.requirements.height}px
						</td>
						<td class="py-3 px-4">{doc.requirements.dpi}</td>
						<td class="py-3 px-4 capitalize">{doc.requirements.background}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if filteredDocuments.length === 0}
		<div class="text-center py-12">
			<p class="text-muted-foreground">No documents found</p>
		</div>
	{/if}
</div>
