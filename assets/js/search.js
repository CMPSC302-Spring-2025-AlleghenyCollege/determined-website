/**
 * Search functionality for the Determined application
 * Provides real-time search capabilities across all pages in the site
 */

document.addEventListener('DOMContentLoaded', function () {
    // Array to store all searchable content from the site
    const search_data = [];
    
    // DOM elements for search functionality
    const search_input = document.querySelector('.search-container input');
    const search_results = document.getElementById('searchResults');

    // Keep track of current search results for keyboard navigation
    let current_results = [];
    let selected_index = -1;

    // Base URL for resolving site-relative paths
    let base_url = '';

    /**
     * Get the repository name from the URL path
     * This is needed for GitHub Pages to construct correct paths
     */
    function getRepoPath() {
        const pathParts = window.location.pathname.split('/');
        // If on GitHub Pages, the repo name will be the first part after the domain
        if (pathParts.length > 1 && pathParts[1] !== '') {
            return '/' + pathParts[1];
        }
        return '';
    }

    /**
     * Get the site root from the URL of this script.
     * This keeps search results on the same deployment, including GitHub Pages
     * project sites whose repository name is part of the URL.
     */
    function getSiteBaseUrl() {
        const search_script = Array.from(document.scripts).find(script =>
            /\/assets\/js\/search\.js(?:[?#].*)?$/.test(script.src)
        );

        if (search_script) {
            return new URL('../../', search_script.src).href.replace(/\/$/, '');
        }

        return window.location.origin + getRepoPath();
    }

    /**
     * Resolve a path to an absolute URL using the configured base URL
     * @param {string} path - The relative or absolute path to resolve
     * @returns {string} The fully resolved URL
     */
    function resolve_url(path) {
        // If it's already absolute with protocol, return as is
        if (path.match(/^(https?:)?\/\//)) {
            return path;
        }

        // If base_url is not set, derive it from the current deployment
        if (!base_url) {
            base_url = getSiteBaseUrl();
        }

        // If it starts with a slash, append to the configured base URL
        if (path.startsWith('/')) {
            return base_url + path;
        }

        // Otherwise, it's a relative path - resolve against current page path
        const current_path = window.location.pathname;
        const current_dir = current_path.substring(0, current_path.lastIndexOf('/') + 1);
        return window.location.origin + current_dir + path;
    }

    /**
     * Fetch HTML content from a URL
     * @param {string} url - The URL to fetch content from
     * @returns {Promise<string|null>} The HTML content or null if fetch failed
     */
    async function fetch_content(url) {
        try {
            // Make sure we're using an absolute URL
            const absolute_url = resolve_url(url);
            const response = await fetch(absolute_url);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${absolute_url}: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    }

    /**
     * Extract searchable content from HTML
     * @param {string} html - The HTML content to parse
     * @param {string} url - The URL of the page
     * @param {string} badge - Category label for the page
     * @param {string} title - Optional title override
     * @returns {Object} Structured search data for the page
     */
    function extract_content(html, url, badge, title) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Use the provided title or get from document
        const page_title = title || doc.querySelector('title')?.textContent || 'Untitled';

        // Get main content text
        const main_element = doc.querySelector('main');
        const main_content = main_element ? main_element.textContent.trim() : '';

        // Get headings for better search context
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(h => h.textContent.trim());

        // Get paragraphs for better search context
        const paragraphs = Array.from(doc.querySelectorAll('p'))
            .map(p => p.textContent.trim());

        // Create a smart preview - prefer using actual content paragraphs
        let preview = '';
        if (paragraphs.length > 0) {
            // Use the first substantial paragraph (more than 50 chars)
            for (const paragraph of paragraphs) {
                if (paragraph.length > 50) {
                    preview = paragraph.substring(0, 150);
                    if (paragraph.length > 150) preview += '...';
                    break;
                }
            }
        }

        // Fallback to main content if no good paragraph found
        if (!preview) {
            preview = main_content.substring(0, 150);
            if (main_content.length > 150) preview += '...';
        }

        // Combine all content for searching - lowercase for case-insensitive search
        const content = [
            page_title,
            ...headings,
            ...paragraphs,
            main_content
        ].join(' ').toLowerCase();

        // Add meta information for better search context
        const meta = {
            date: doc.querySelector('meta[name="date"]')?.content,
            description: doc.querySelector('meta[name="description"]')?.content,
            keywords: doc.querySelector('meta[name="keywords"]')?.content?.split(',').map(k => k.trim())
        };

        // Return structured search data for this page
        return {
            url: url, // Store original URL from sitemap
            absolute_url: resolve_url(url), // Store resolved absolute URL
            title: page_title,
            content: content,
            preview: preview,
            badge: badge,
            meta: meta
        };
    }

    /**
     * Build the search index by processing all pages in the sitemap
     */
    async function build_search_index() {
        search_data.length = 0; // Clear existing data

        try {
            // Always load search data from the same deployment as this script
            base_url = getSiteBaseUrl();
            const search_json_path = `${base_url}/assets/js/search.json`;
            
            console.log('Loading search data from:', search_json_path);

            // Load sitemap from JSON file
            const response = await fetch(search_json_path);
            if (!response.ok) {
                throw new Error(`Failed to load sitemap: ${response.status}`);
            }

            const sitemap_data = await response.json();

            console.log('Using base URL:', base_url);

            console.log('Loaded sitemap with', sitemap_data.sitemap.length, 'pages');

            // Process each page in the sitemap
            for (const page of sitemap_data.sitemap) {
                try {
                    // Resolve URL to absolute before fetching
                    const absolute_url = resolve_url(page.url);
                    const html = await fetch_content(absolute_url);

                    if (html) {
                        // Extract content and add sitemap metadata
                        const page_data = extract_content(html, page.url, page.badge, page.title);
                        search_data.push(page_data);
                    } else {
                        // If can't fetch the page, still add basic info from sitemap
                        search_data.push({
                            url: page.url,
                            absolute_url: absolute_url,
                            title: page.title,
                            content: page.title.toLowerCase(),
                            preview: `Visit ${page.title}`,
                            badge: page.badge
                        });
                    }
                } catch (error) {
                    console.log(`Could not index ${page.url}, adding basic entry:`, error);
                    search_data.push({
                        url: page.url,
                        absolute_url: resolve_url(page.url),
                        title: page.title,
                        content: page.title.toLowerCase(),
                        preview: `Visit ${page.title}`,
                        badge: page.badge
                    });
                }
            }

            console.log('Search index built with', search_data.length, 'entries');
        } catch (error) {
            console.error('Error building search index:', error);
            // Fall back to the current deployment
            base_url = getSiteBaseUrl();
            
            // Fall back to minimal search data for basic navigation
            const pages = [
                { url: '/index.html', title: 'Home', badge: 'home' },
                { url: '/pages/about.html', title: 'About', badge: 'page' },
                { url: '/pages/resources.html', title: 'Resources', badge: 'page' },
                { url: '/pages/settings.html', title: 'Settings', badge: 'page' },
                { url: '/pages/game.html', title: 'Game', badge: 'game' }
            ];
            
            // Add fallback search entries
            pages.forEach(page => {
                search_data.push({
                    url: page.url,
                    absolute_url: resolve_url(page.url),
                    title: page.title,
                    content: page.title.toLowerCase(),
                    preview: `Navigate to ${page.title}`,
                    badge: page.badge
                });
            });
            
            console.log('Using fallback search index with basic navigation');
        }
    }

    /**
     * Navigate to a search result
     * @param {Object} result - The search result to navigate to
     */
    function navigate_to_result(result) {
        if (result) {
            window.location.href = result.absolute_url || resolve_url(result.url);
        }
    }

    /**
     * Perform search based on current input value
     * This is the main search function called when the user types
     */
    function perform_search() {
        const query = search_input.value.trim().toLowerCase();

        // Clear results if query is empty
        if (!query) {
            search_results.classList.remove('active');
            search_results.innerHTML = '';
            current_results = [];
            selected_index = -1;
            return;
        }

        // Filter search data based on query
        current_results = search_data.filter(item =>
            item.content.includes(query) ||
            item.title.toLowerCase().includes(query)
        );

        // Display search results
        display_results(current_results, query);
    }

    /**
     * Display search results in the DOM
     * @param {Array} results - The search results to display
     * @param {string} query - The search query for highlighting
     */
    function display_results(results, query) {
        search_results.innerHTML = '';
        selected_index = -1;

        // Show the results container if we have results
        if (results.length > 0) {
            search_results.classList.add('active');

            // Create header with result count
            const header = document.createElement('div');
            header.className = 'search-results-header';
            header.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`;
            search_results.appendChild(header);

            // Add each result to the DOM
            results.forEach((result, index) => {
                const result_item = document.createElement('div');
                result_item.className = 'search-result-item';
                result_item.setAttribute('data-index', index);
                
                // Add result badge/category
                const badge_element = document.createElement('span');
                badge_element.className = 'result-type-badge ' + result.badge;
                badge_element.textContent = result.badge.charAt(0).toUpperCase() + result.badge.slice(1);
                result_item.appendChild(badge_element);

                // Add title with highlighted query matches
                const title = document.createElement('h4');
                title.innerHTML = highlight_text(result.title, query);
                result_item.appendChild(title);

                // Add preview with highlighted query matches
                const preview = document.createElement('p');
                preview.innerHTML = highlight_text(result.preview, query);
                result_item.appendChild(preview);

                // Make clickable to navigate to page
                result_item.addEventListener('click', () => {
                    navigate_to_result(result);
                });

                // Add to search results container
                search_results.appendChild(result_item);
            });
        } else {
            // No results found
            search_results.classList.add('active');
            const no_results = document.createElement('div');
            no_results.className = 'no-results';
            no_results.textContent = `No results found for "${query}"`;
            search_results.appendChild(no_results);
        }
    }

    /**
     * Highlight search query matches in text
     * @param {string} text - The text to highlight
     * @param {string} query - The search query
     * @returns {string} HTML with highlighted matches
     */
    function highlight_text(text, query) {
        if (!query || !text) return text;
        
        // Escape special regex characters in the query
        const escaped_query = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create a regex to find all instances of the query
        const regex = new RegExp(`(${escaped_query})`, 'gi');
        
        // Replace with highlighted version
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    /**
     * Handle keyboard navigation in search results
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handle_keyboard_navigation(event) {
        // Only process if search results are visible
        if (!search_results.classList.contains('active') || current_results.length === 0) {
            return;
        }

        const result_items = search_results.querySelectorAll('.search-result-item');
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                // Move selection down
                selected_index = Math.min(selected_index + 1, result_items.length - 1);
                update_selection(result_items);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                // Move selection up
                selected_index = Math.max(selected_index - 1, 0);
                update_selection(result_items);
                break;
                
            case 'Enter':
                // Navigate to selected result
                if (selected_index >= 0 && selected_index < current_results.length) {
                    event.preventDefault();
                    navigate_to_result(current_results[selected_index]);
                }
                break;
                
            case 'Escape':
                // Close search results
                event.preventDefault();
                search_input.value = '';
                search_results.classList.remove('active');
                search_results.innerHTML = '';
                current_results = [];
                selected_index = -1;
                break;
        }
    }

    /**
     * Update the visual selection in search results
     * @param {NodeList} result_items - The search result DOM elements
     */
    function update_selection(result_items) {
        // Remove active class from all items
        result_items.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected item and scroll into view if needed
        if (selected_index >= 0 && selected_index < result_items.length) {
            const selected_item = result_items[selected_index];
            selected_item.classList.add('active');
            selected_item.scrollIntoView({ block: 'nearest' });
        }
    }

    // Init search when page loads
    build_search_index();
    
    // Set up event listeners
    search_input.addEventListener('input', perform_search);
    search_input.addEventListener('keydown', handle_keyboard_navigation);
    
    // Close search results when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.search-container')) {
            search_results.classList.remove('active');
        }
    });
    
    // Make the search function globally available
    window.perform_search = perform_search;
});
