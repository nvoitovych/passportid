import { writable } from 'svelte/store';
import type { Document } from '$lib/types/document';

export const selectedDocument = writable<Document | null>(null);

