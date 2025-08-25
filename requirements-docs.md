RAG System Frontend: Development Specification
Project: A Next.js web application to serve as a comprehensive user interface for the local RAG (Retrieval-Augmented Generation) API.

Prerequisites: This guide assumes a Next.js project using the Pages Router, with Tailwind CSS and shadcn/ui already installed and configured.

API Base URL: http://localhost:8000 (Assume this is configurable)

1. Page: Dashboard (pages/index.tsx)
Purpose: Provide a high-level, real-time overview of the RAG system's health and statistics.

API Endpoints Used:

GET /stats

GET /health

POST /rebuild-index

Component Breakdown:

StatCard Component (Reusable): A card that takes a title, value, and an optional icon.

Main Page Component:

Data Fetching: On component mount (useEffect), make parallel API calls to GET /stats and GET /health. Use a loading state to show spinners while data is being fetched.

Health Status Indicator:

Display a green dot and the text "System is healthy" based on the status from the /health response.

Show the API version from the same response.

Statistics Grid: A responsive grid displaying the following data from the /stats response using the StatCard component:

Total Knowledge Bases: total_vector_stores

Total Documents: total_documents

Total Chunks: total_chunks

System Uptime: Format the uptime_seconds into a human-readable string (e.g., "1d 4h 15m").

Global Actions Section:

A section with a "Rebuild All Indexes" button.

Button Logic:

On click, show a confirmation modal: "Are you sure you want to rebuild all indexes? This will re-ingest all source data and can take some time."

On confirmation, make a POST request to /rebuild-index.

While the request is pending, disable the button and show a loading spinner.

On a successful response, display a global toast notification: "✅ Index rebuild successfully started."

2. Page: Query Playground (pages/query.tsx)
Purpose: The primary user interface for running RAG queries with detailed configuration and visualizing the complete response.

API Endpoints Used:

POST /query

GET /vector-stores (to populate the store selector)

Layout: A two-panel, responsive layout. Left panel for configuration, right panel for results.

Component Breakdown:

2.1. Configuration Panel (Left Side)
This will be a form that manages the state for the /query request body.

State Management: Use useState to manage a single state object that mirrors the structure of the /query request body.

Main Inputs:

Question: A large <Textarea> for the question field (required).

System Prompt: An optional <Textarea> for the system_prompt field.

Configuration Accordion: Use an accordion component to group settings.

Retrieval Settings:

Knowledge Bases: A multi-select component (e.g., from shadcn/ui) for the vector_stores array.

Data: Fetch all stores from GET /vector-stores on page load.

Display: Show the name of each store in the dropdown.

State: Store the selected store_ids in the state object.

Top K: A <Slider> or <Input type="number"> for the top_k field.

Similarity Threshold: A <Slider> (0 to 1, step 0.01) for the similarity_threshold field.

Generation Settings:

Temperature: A <Slider> (0 to 1, step 0.01) for the temperature field.

Max Tokens: A <Slider> with a range of 1000 to 4000 for the max_tokens field.

Advanced Options:

Include Sources: A <Switch> for the include_sources boolean.

Query Expansion: A <Switch> for the query_expansion boolean.

Metadata Filters: (Optional, advanced feature) A simple key-value input UI to build the metadata_filters object.

Submit Button:

A "Generate Answer" button.

It should be disabled if the question text area is empty.

On click, it constructs the request body from the state and calls POST /query.

Show a loading state on the button and in the results panel while the API call is in progress.

2.2. Results Panel (Right Side)
This panel will display the response from the /query API call.

Initial State: Display a placeholder message like "Your results will appear here."

Loading State: Show a skeleton loader or a spinner.

Error State: If the API returns a status of "error", display the message from the response in an alert box.

Success State (status: "success"):

Answer Card: A primary card component prominently displaying the answer.

Summary Bar: A horizontal bar with key metrics:

Tokens: usage.total_tokens

Cost: $${usage.cost_usd.toFixed(6)}

Retrieval Time: ${retrieval.retrieval_time_ms} ms

Retrieved Documents Section:

An Accordion or collapsible section titled "Sources (retrieval.total_documents_retrieved retrieved)".

Map over the retrieval.documents array to render a list of SourceDocumentCard components.

SourceDocumentCard Component:

Header: Display source_name and location.

Score: Show the score formatted as a percentage (e.g., "84.2% relevance").

Content: Display the snippet.

Metadata: If present, display any metadata.tags or other key-value pairs.

3. Page: Manage Knowledge Bases (pages/stores/index.tsx)
Purpose: Provide a central dashboard for viewing, creating, and deleting vector stores.

API Endpoints Used:

GET /vector-stores

POST /vector-stores

DELETE /vector-stores/{store_id}

Component Breakdown:

Page Header:

Title: "Manage Knowledge Bases".

"Create New" Button: On click, opens the CreateStoreModal.

CreateStoreModal Component:

A modal dialog with a form to create a new store.

Form Fields (mapping to POST /vector-stores body):

name: <Input type="text"> (required)

description: <Textarea>

config.chunk_size: <Input type="number">

config.chunk_overlap: <Input type="number">

config.embedding_model: <Input type="text">

Submit Logic: On submit, call the API. On success, close the modal, show a success toast, and refresh the list of stores.

Knowledge Base Table (DataTable from shadcn/ui):

Data: Fetched from GET /vector-stores.

Columns:

Name: name

Description: description

Status: status (display with a colored badge)

Documents: stats.total_documents

Chunks: stats.total_chunks

Last Updated: Format stats.last_updated into a readable date/time.

Row Actions: An actions menu (...) for each row with two options:

Manage: A link that navigates to /stores/[store_id].

Delete: On click, opens a confirmation modal. On confirm, call DELETE /vector-stores/{store_id}, show a toast, and refresh the table.

4. Page: Knowledge Base Detail (pages/stores/[store_id].tsx)
Purpose: A dedicated page to manage a single knowledge base, including its settings and documents.

API Endpoints Used:

GET /vector-stores/{store_id}

GET /vector-stores/{store_id}/documents

POST /vector-stores/{store_id}/documents

PATCH /vector-stores/{store_id} (Assumed endpoint for updates)

Component Breakdown:

Layout: Use a Tabs component (<Tabs defaultValue="overview">) to switch between "Overview & Settings" and "Document Management".

Data Fetching:

Use the useRouter hook to get the store_id from the URL query parameters.

On page load, if store_id is available, make parallel API calls to GET /vector-stores/{store_id} and GET /vector-stores/{store_id}/documents.

Manage a loading state for the entire page until both requests are complete.

4.1. Tab 1: Overview & Settings
Overview Section:

Display read-only information from the /vector-stores/{store_id} response. Use a two-column grid or definition list for clarity.

Fields to Display: store_id, created_at, updated_at, status.

Statistics Card: A dedicated card to display the stats object: total_documents, total_chunks, index_size, and last_updated.

Configuration Card: A card to display the current config object: chunk_size, chunk_overlap, embedding_model, embedding_task.

Settings Form:

A form pre-populated with the store's current name, description, and config object. Use useEffect to populate the form state once the data is fetched.

Fields:

name: <Input type="text">

description: <Textarea>

config.chunk_size: <Input type="number">

config.chunk_overlap: <Input type="number">

config.embedding_model: <Input type="text">

Submit Logic:

An "Update Settings" button at the bottom of the form.

On click, construct a request body with only the changed fields.

Make a PATCH request to /vector-stores/{store_id}.

On success, show a toast notification ("✅ Store updated successfully") and refresh the data for the overview section.

4.2. Tab 2: Document Management
File Upload Component:

Use a library like react-dropzone to create a user-friendly drag-and-drop file upload zone.

On files added, manage an array of file upload states (e.g., { file, progress, status: 'uploading' | 'success' | 'error' }).

For each file, create a FormData object and append the file to it.

Make an individual POST request to /vector-stores/{store_id}/documents. Use an Axios or fetch interceptor to track upload progress.

Display a list of files being uploaded with individual progress bars.

After all uploads are complete, automatically refresh the document table below.

Document Table:

A DataTable displaying the list of documents from the GET /vector-stores/{store_id}/documents API call.

Show a message like "No documents found. Upload files to get started." if the data array is empty.

Columns: filename, file_type, file_size (formatted to KB/MB), total_chunks, upload_timestamp.

Row Actions: Include a "Delete" option if the API supports deleting individual documents. This should trigger a confirmation modal before making the API call.