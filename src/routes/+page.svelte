<script lang="ts">
  import { onDestroy } from 'svelte';

  let presentationFile: File | null = null;
  let critique: string = 'Upload a PDF to get started.';
  let presentationUrl: string | null = null;
  let isLoading: boolean = false;
  let errorMessage: string | null = null;

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      presentationFile = target.files[0];
      console.log('File selected:', presentationFile.name);

      // Clean up previous object URL if exists
      if (presentationUrl) {
        URL.revokeObjectURL(presentationUrl);
      }
      presentationUrl = URL.createObjectURL(presentationFile);

      // Trigger critique generation
      await generateCritique();

    } else {
      presentationFile = null;
      presentationUrl = null;
      critique = 'Upload a PDF to get started.';
      errorMessage = null;
      // Clean up object URL if file is deselected
      if (presentationUrl) {
        URL.revokeObjectURL(presentationUrl);
      }
    }
  }

  async function generateCritique() {
    if (!presentationFile) return;

    isLoading = true;
    errorMessage = null;
    critique = 'Generating critique... Please wait.'; // Provide initial loading message

    const formData = new FormData();
    formData.append('presentation', presentationFile);

    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        // Use the error message from the API response if available
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      critique = result.critique || 'Critique generated successfully, but content is empty.';

    } catch (error: any) {
      console.error('Error generating critique:', error);
      errorMessage = error.message || 'Failed to generate critique.';
      critique = 'An error occurred while generating the critique.'; // More informative error message
    } finally {
      isLoading = false;
    }
  }

  // Clean up object URL when component is destroyed
  onDestroy(() => {
    if (presentationUrl) {
      URL.revokeObjectURL(presentationUrl);
    }
  });
</script>

<div class="grid grid-cols-2 gap-4 h-screen p-4">
  <!-- Left Column: Critique -->
  <div class="border rounded p-4 overflow-y-auto bg-gray-50 flex flex-col">
    <h2 class="text-xl font-semibold mb-4 shrink-0">Critique & Notes</h2>
    <div class="flex-grow overflow-y-auto">
      {#if isLoading}
        <p class="text-blue-600 animate-pulse">Generating critique... Please wait.</p>
      {:else if errorMessage}
        <p class="text-red-600 font-semibold">Error:</p>
        <p class="text-red-600">{errorMessage}</p>
        <pre class="whitespace-pre-wrap mt-2 text-sm">{critique}</pre> <!-- Show base message even on error -->
      {:else}
        <pre class="whitespace-pre-wrap">{critique}</pre>
      {/if}
    </div>
  </div>

  <!-- Right Column: Presentation Viewer & Upload -->
  <div class="border rounded p-4 flex flex-col bg-gray-50">
    <h2 class="text-xl font-semibold mb-4 shrink-0">Presentation</h2>
    <div class="mb-4 shrink-0">
      <label for="presentation-upload" class="block mb-2 text-sm font-medium text-gray-900">
        Upload PDF Presentation:
      </label>
      <input
        type="file"
        id="presentation-upload"
        accept=".pdf"
        on:change={handleFileSelect}
        class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        disabled={isLoading}
      />
    </div>
    <div class="flex-grow border rounded bg-white overflow-auto min-h-0"> {/* Added min-h-0 for flex grow */}
      {#if presentationUrl}
        <!-- Basic embed for PDF - will replace with pdf.js later -->
        <iframe src={presentationUrl} title="Presentation Preview" class="w-full h-full border-0"></iframe>
        <p class="p-1 text-xs text-gray-500 text-center">Note: Basic PDF preview. Full rendering requires pdf.js.</p>
      {:else}
        <div class="flex items-center justify-center h-full text-gray-500">
          Upload a PDF to view it here.
        </div>
      {/if}
    </div>
  </div>
</div>
