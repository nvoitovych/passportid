<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { getUniqueCountries } from '$lib/utils/documentSearch';
	import { goto } from '$app/navigation';
	import * as THREE from 'three';
	// @ts-ignore - OrbitControls doesn't have types
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

	let globeEl: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let animationId: number;
	let pointsRef: THREE.Points;
	let hoveredCountry: string | null = null;
	let hoveredCountryCode: string | null = null;
	let selectedCountry: { code: string; name: string; documents: any[] } | null = null;
	let selectedCountryCode: string | null = null;
	let countryMarkers: THREE.Group[] = [];
	let tooltipPosition = { x: 0, y: 0 };
	let tooltipStyle = '';
	let tooltipVisible = false;
	let tooltipHovered = false;
	let autoHideTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

	const countries = getUniqueCountries();

	// Country code to coordinates mapping
	const countryCoordinates: Record<string, { lat: number; lon: number }> = {
		US: { lat: 37.0902, lon: -95.7129 },
		GB: { lat: 55.3781, lon: -3.4360 },
		CA: { lat: 56.1304, lon: -106.3468 },
		AU: { lat: -25.2744, lon: 133.7751 },
		DE: { lat: 51.1657, lon: 10.4515 },
		FR: { lat: 46.2276, lon: 2.2137 },
		IT: { lat: 41.8719, lon: 12.5674 },
		ES: { lat: 40.4637, lon: -3.7492 },
		NL: { lat: 52.1326, lon: 5.2913 },
		BE: { lat: 50.5039, lon: 4.4699 },
		CH: { lat: 46.8182, lon: 8.2275 },
		AT: { lat: 47.5162, lon: 14.5501 },
		SE: { lat: 60.1282, lon: 18.6435 },
		NO: { lat: 60.4720, lon: 8.4689 },
		DK: { lat: 56.2639, lon: 9.5018 },
		FI: { lat: 61.9241, lon: 25.7482 },
		PL: { lat: 51.9194, lon: 19.1451 },
		CZ: { lat: 49.8175, lon: 15.4730 },
		IE: { lat: 53.4129, lon: -8.2439 },
		PT: { lat: 39.3999, lon: -8.2245 },
		GR: { lat: 39.0742, lon: 21.8243 },
		UA: { lat: 48.3794, lon: 31.1656 },
		RU: { lat: 61.5240, lon: 105.3188 },
		CN: { lat: 35.8617, lon: 104.1954 },
		JP: { lat: 36.2048, lon: 138.2529 },
		KR: { lat: 35.9078, lon: 127.7669 },
		IN: { lat: 20.5937, lon: 78.9629 },
		BR: { lat: -14.2350, lon: -51.9253 },
		MX: { lat: 23.6345, lon: -102.5528 },
		AR: { lat: -38.4161, lon: -63.6167 },
		ZA: { lat: -30.5595, lon: 22.9375 },
		NZ: { lat: -40.9006, lon: 174.8860 },
		SG: { lat: 1.3521, lon: 103.8198 },
		MY: { lat: 4.2105, lon: 101.9758 },
		TH: { lat: 15.8700, lon: 100.9925 },
		PH: { lat: 12.8797, lon: 121.7740 },
		ID: { lat: -0.7893, lon: 113.9213 },
		VN: { lat: 14.0583, lon: 108.2772 },
		TR: { lat: 38.9637, lon: 35.2433 },
		EG: { lat: 26.0975, lon: 30.0444 },
		IL: { lat: 31.0461, lon: 34.8516 },
		AE: { lat: 23.4241, lon: 53.8478 },
		SA: { lat: 23.8859, lon: 45.0792 }
	};

	function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		const x = -(radius * Math.sin(phi) * Math.cos(theta));
		const z = radius * Math.sin(phi) * Math.sin(theta);
		const y = radius * Math.cos(phi);

		return new THREE.Vector3(x, y, z);
	}

	function createParticlePoints(particleCount: number, radius: number) {
		const positions = new Float32Array(particleCount * 3);
		const colors = new Float32Array(particleCount * 3);
		const baseColor = new THREE.Color(0x3d9b93);
		const dimColor = new THREE.Color(0x5bb5ac);

		for (let i = 0; i < particleCount; i++) {
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			const color = Math.random() > 0.7 ? baseColor : dimColor;
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		geometry.userData.originalPositions = positions.slice();

		const material = new THREE.PointsMaterial({
			size: 0.015,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true
		});

		return new THREE.Points(geometry, material);
	}

	function createCountryMarkers(radius: number) {
		const markers: THREE.Group[] = [];

		countries.forEach((country) => {
			const coords = countryCoordinates[country.code];
			if (!coords) return;

			const position = latLonToVector3(coords.lat, coords.lon, radius + 0.05);
			const group = new THREE.Group();
			group.position.copy(position);

			const geometry = new THREE.SphereGeometry(0.04, 16, 16);
			const material = new THREE.MeshBasicMaterial({
				color: 0x3d9b93,
				transparent: true,
				opacity: 0.9
			});

			const sphere = new THREE.Mesh(geometry, material);
			group.add(sphere);

			// Store country data for hover detection
			(sphere as any).userData = { country: country.name, code: country.code };

			markers.push(group);
		});

		return markers;
	}

	function clearAutoHide() {
		if (autoHideTimeout) {
			clearTimeout(autoHideTimeout);
			autoHideTimeout = null;
		}
		if (hideTooltipTimeout) {
			clearTimeout(hideTooltipTimeout);
			hideTooltipTimeout = null;
		}
	}

	function updateMarkerColors() {
		if (countryMarkers && countryMarkers.length > 0) {
			countryMarkers.forEach((marker) => {
				const mesh = marker.children[0] as THREE.Mesh;
				const material = mesh.material as THREE.MeshBasicMaterial;
				const meshCountryCode = (mesh as any).userData.code;
				
				if (meshCountryCode === selectedCountryCode) {
					// Selected country - bright gold and larger
					material.color.setHex(0xffd700);
					mesh.scale.set(1.5, 1.5, 1.5);
				} else if (meshCountryCode === hoveredCountryCode) {
					// Hovered country - gold
					material.color.setHex(0xffd700);
					mesh.scale.set(1, 1, 1);
				} else {
					// Other countries - default color
					material.color.setHex(0x3d9b93);
					mesh.scale.set(1, 1, 1);
				}
			});
		}
	}

	function setAutoHide() {
		clearAutoHide();
		// Only set auto-hide if tooltip is not being hovered
		if (!tooltipHovered && tooltipVisible) {
			autoHideTimeout = setTimeout(() => {
				if (!tooltipHovered) {
					tooltipVisible = false;
					selectedCountry = null;
					selectedCountryCode = null;
					// Reset all marker colors when tooltip hides
					updateMarkerColors();
				}
				autoHideTimeout = null;
			}, 5000); // 5 seconds
		}
	}

	onMount(() => {
		if (!browser || !globeEl) return;

		try {
			const width = globeEl.clientWidth;
			const height = globeEl.clientHeight;

			if (width === 0 || height === 0) {
				console.warn('Globe container has zero dimensions');
				return;
			}

		// Scene setup
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf8fafa);

		// Camera setup
		camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
		camera.position.set(0, 0, 5);

		// Renderer setup
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		renderer.setPixelRatio(window.devicePixelRatio);
		globeEl.appendChild(renderer.domElement);

		// Lights
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		const pointLight = new THREE.PointLight(0xffffff, 1);
		pointLight.position.set(10, 10, 10);
		scene.add(pointLight);

		// Create particle points - smaller globe
		const radius = 1.5; // Reduced from 2 to make globe smaller
		const particleCount = 8000;
		pointsRef = createParticlePoints(particleCount, radius);
		scene.add(pointsRef);

		// Create country markers
		countryMarkers = createCountryMarkers(radius);
		countryMarkers.forEach((marker) => scene.add(marker));

		// Controls - disable zoom on scroll
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableZoom = false; // Disable zoom to prevent scroll interception
		controls.enablePan = false;
		controls.minDistance = 4; // Increased to make globe appear smaller
		controls.maxDistance = 8;
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5;

		// Allow scroll to pass through - never prevent default on wheel
		// This allows page scrolling to work normally
		renderer.domElement.addEventListener('wheel', (e) => {
			// Don't prevent default - allow scroll to pass through
		}, { passive: true });

		// Raycaster for hover detection
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();

		function onMouseMove(event: MouseEvent) {
			// Don't update tooltip position if hovering over the tooltip itself
			const target = event.target as HTMLElement;
			if (target.closest('.country-tooltip')) {
				return;
			}

			const rect = renderer.domElement.getBoundingClientRect();
			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(
				countryMarkers.map((m) => m.children[0] as THREE.Mesh)
			);

			if (intersects.length > 0) {
				const countryData = (intersects[0].object as any).userData;
				const country = countryData.country;
				const countryCode = countryData.code;
				
				if (countryCode !== hoveredCountryCode) {
					hoveredCountry = country;
					hoveredCountryCode = countryCode;
					
					// Clear previous auto-hide timeout
					clearAutoHide();
					tooltipHovered = false;
					
					// Show tooltip on hover
					const countryInfo = countries.find((c) => c.code === countryCode);
					if (countryInfo) {
						import('$lib/utils/documentSearch').then(({ getDocumentsByCountry }) => {
							const docs = getDocumentsByCountry(countryCode);
							
							// Update tooltip position
							const x = event.clientX - rect.left;
							const y = event.clientY - rect.top;
							tooltipPosition = { x, y };
							const tooltipWidth = 300;
							const tooltipHeight = 200;
							const left = Math.min(x + 20, rect.width - tooltipWidth - 20);
							const top = Math.max(y - tooltipHeight - 20, 20);
							tooltipStyle = `left: ${left}px; top: ${top}px;`;
							
							// Update selected country
							selectedCountry = {
								code: countryCode,
								name: countryInfo.name,
								documents: docs
							};
							selectedCountryCode = countryCode;
							tooltipVisible = true;
							
							// Update marker colors
							updateMarkerColors();
							
							// Set auto-hide after 5 seconds (only if not hovered)
							setTimeout(() => {
								setAutoHide();
							}, 100);
						});
					}
				}
			} else if (hoveredCountryCode) {
				hoveredCountry = null;
				hoveredCountryCode = null;
				updateMarkerColors();
				
				// Hide tooltip when mouse leaves country marker (unless tooltip itself is hovered)
				// Add delay to give user time to move cursor to tooltip
				if (!tooltipHovered) {
					clearAutoHide();
					// Delay hiding to allow user to move to tooltip
					hideTooltipTimeout = setTimeout(() => {
						if (!tooltipHovered) {
							tooltipVisible = false;
							selectedCountry = null;
							selectedCountryCode = null;
						}
						hideTooltipTimeout = null;
					}, 300); // 300ms delay to move cursor to tooltip
				}
			}
		}

		function onMouseClick(event: MouseEvent) {
			// Don't handle click if clicking on tooltip
			const target = event.target as HTMLElement;
			if (target.closest('.country-tooltip')) {
				return;
			}

			const rect = renderer.domElement.getBoundingClientRect();
			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(
				countryMarkers.map((m) => m.children[0] as THREE.Mesh)
			);

			if (intersects.length > 0) {
				const countryData = (intersects[0].object as any).userData;
				const countryCode = countryData.code;
				const countryInfo = countries.find((c) => c.code === countryCode);
				
				if (countryInfo) {
					// Clear previous auto-hide timeout and reset hover state
					clearAutoHide();
					tooltipHovered = false;
					
					// Update selected country code for highlighting
					selectedCountryCode = countryCode;
					
					// Select the country and show tooltip immediately
					import('$lib/utils/documentSearch').then(({ getDocumentsByCountry }) => {
						const docs = getDocumentsByCountry(countryCode);
						
						// Update tooltip position - fixed position, doesn't move
						const x = event.clientX - rect.left;
						const y = event.clientY - rect.top;
						tooltipPosition = { x, y };
						const tooltipWidth = 300;
						const tooltipHeight = 200;
						const left = Math.min(x + 20, rect.width - tooltipWidth - 20);
						const top = Math.max(y - tooltipHeight - 20, 20);
						tooltipStyle = `left: ${left}px; top: ${top}px;`;
						
						// Update selected country - this will trigger reactivity
						selectedCountry = {
							code: countryCode,
							name: countryInfo.name,
							documents: docs
						};
						tooltipVisible = true;
						
						// Update marker colors - highlight selected
						updateMarkerColors();
						
						// Set auto-hide after 5 seconds (only if not hovered)
						// Use setTimeout to ensure state is updated
						setTimeout(() => {
							setAutoHide();
						}, 100);
					});
				}
			} else {
				// Click outside - close tooltip if clicking on globe background
				if (event.target === renderer.domElement) {
					clearAutoHide();
					tooltipHovered = false;
					tooltipVisible = false;
					selectedCountry = null;
					selectedCountryCode = null;
					
					// Reset all marker colors
					updateMarkerColors();
				}
			}
		}


		renderer.domElement.addEventListener('mousemove', onMouseMove);
		renderer.domElement.addEventListener('click', onMouseClick);

		// Animation loop
		const clock = new THREE.Clock();
		function animate() {
			animationId = requestAnimationFrame(animate);

			const time = clock.getElapsedTime();

			// Animate particles
			if (pointsRef) {
				const positions = pointsRef.geometry.attributes.position.array as Float32Array;
				const originalPositions = pointsRef.geometry.userData.originalPositions as Float32Array;

				if (originalPositions) {
					for (let i = 0; i < positions.length; i += 3) {
						const offset = Math.sin(time * 2 + i * 0.01) * 0.02;
						positions[i] = originalPositions[i] + offset * Math.cos(time + i);
						positions[i + 1] = originalPositions[i + 1] + offset * Math.sin(time + i);
						positions[i + 2] = originalPositions[i + 2] + offset * Math.cos(time * 0.5 + i);
					}
					pointsRef.geometry.attributes.position.needsUpdate = true;
				}
			}

			controls.update();
			renderer.render(scene, camera);
		}
		animate();

		// Handle resize
		function handleResize() {
			const newWidth = globeEl.clientWidth;
			const newHeight = globeEl.clientHeight;
			camera.aspect = newWidth / newHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(newWidth, newHeight);
		}
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			clearAutoHide();
			window.removeEventListener('resize', handleResize);
			if (renderer && renderer.domElement) {
				renderer.domElement.removeEventListener('mousemove', onMouseMove);
				renderer.domElement.removeEventListener('click', onMouseClick);
			}
			if (animationId) cancelAnimationFrame(animationId);
			if (renderer) {
				renderer.dispose();
				if (globeEl && renderer.domElement && renderer.domElement.parentNode) {
					renderer.domElement.parentNode.removeChild(renderer.domElement);
				}
			}
		};
		} catch (error) {
			console.error('Error initializing globe:', error);
		}
	});
</script>

{#if browser}
	<div
		bind:this={globeEl}
		class="h-[600px] w-full rounded-2xl overflow-hidden bg-card border border-border/50 mx-auto max-w-7xl relative"
		style="cursor: grab;"
	>
		{#if tooltipVisible && selectedCountry}
			<div
				class="country-tooltip absolute z-10 bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs pointer-events-auto cursor-pointer hover:shadow-xl transition-shadow"
				style={tooltipStyle}
				on:click|stopPropagation={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (selectedCountry) {
						clearAutoHide();
						goto(`/documents?country=${selectedCountry.code}`);
					}
				}}
				on:mouseenter={() => {
					tooltipHovered = true;
					clearAutoHide(); // Clear any pending hide timeouts
				}}
				on:mouseleave={() => {
					tooltipHovered = false;
					// Only set auto-hide if tooltip is still visible
					if (tooltipVisible) {
						// Small delay before starting auto-hide to allow re-entering
						setTimeout(() => {
							if (!tooltipHovered && tooltipVisible) {
								setAutoHide();
							}
						}, 100);
					}
				}}
				role="button"
				tabindex="0"
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						if (selectedCountry) {
							clearAutoHide();
							goto(`/documents?country=${selectedCountry.code}`);
						}
					}
				}}
			>
				<h3 class="font-semibold text-lg mb-2">{selectedCountry.name}</h3>
				<p class="text-sm text-muted-foreground mb-3">
					{selectedCountry.documents.length} document{selectedCountry.documents.length !== 1 ? 's' : ''} available
				</p>
				<div class="space-y-1 mb-3">
					{#each selectedCountry.documents.slice(0, 5) as doc}
						<div class="text-sm">
							<span class="font-medium">{doc.name}</span>
							{#if doc.type}
								<span class="text-muted-foreground ml-2">({doc.type})</span>
							{/if}
						</div>
					{/each}
					{#if selectedCountry.documents.length > 5}
						<div class="text-xs text-muted-foreground">
							+{selectedCountry.documents.length - 5} more
						</div>
					{/if}
				</div>
				<div class="text-sm text-primary font-medium mt-3 pt-3 border-t border-border">
					Click to view all documents →
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="h-[600px] w-full flex items-center justify-center bg-card rounded-2xl border border-border/50 mx-auto max-w-7xl">
		<div class="text-muted-foreground">Loading globe...</div>
	</div>
{/if}

<style>
	:global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
		cursor: grab;
	}
	:global(canvas:active) {
		cursor: grabbing;
	}
</style>
