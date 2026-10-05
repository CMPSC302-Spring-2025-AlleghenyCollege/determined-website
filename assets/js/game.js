let game_state = {
    current_scene: 'scene_001',
    resist: 100,  // Resistance score (0-100)
    use: 100,     // Usage urge score (0-100)
    time: 0,      // Time elapsed in hours
    path: [],     // History of visited scenes
    pending_choice: null,
    pending_scene_data: null,
    selected_journey: null,    // Currently selected journey (journey_1, journey_2, etc.)
    use_popup_resources: true, // Whether to show resources as popups or inline
    show_dev_tools: false,     // Whether to show developer tools
    available_tools: [],       // Available toolkit items for current scene
    unlocked_tools: [],        // Tools player has unlocked during this playthrough
    master_toolkit: null,      // All possible tools from the master list
    newly_unlocked_tool: null  // Tracks a newly unlocked tool to show popup
};

// DOM Elements - references to all interactive UI elements
const elements = {
    journey_select: document.getElementById('story-select'),
    game_play: document.getElementById('game-play'),
    journey_cards: document.querySelectorAll('.story-card'),
    journey_buttons: document.querySelectorAll('.select-story-btn'),
    resist_score: document.getElementById('resist-score'),
    use_score: document.getElementById('use-score'),
    resist_bar: document.getElementById('resist-bar'),
    use_bar: document.getElementById('use-bar'),
    time_display: document.getElementById('time'),
    scene_title: document.getElementById('scene-title'),
    scene_narration: document.getElementById('scene-narration'),
    route_id: document.getElementById('route-id') || null,
    scene_path: document.getElementById('scene-path') || null,
    choices_container: document.getElementById('choices'),
    feedback_container: document.getElementById('feedback-container'),
    continue_btn: document.getElementById('continue-btn'),
    outcome_message: document.getElementById('outcome-message'),
    restart_btn: document.getElementById('restart-btn'),
    exit_game_btn: document.getElementById('exit-game-btn'),
    // Resource popup elements
    resource_popup: document.getElementById('resource-popup'),
    resource_description: document.getElementById('resource-description'),
    resource_link: document.getElementById('resource-link'),
    close_resource_popup: document.getElementById('close-resource-popup'),
    // Tool unlock popup elements
    tool_unlock_popup: document.getElementById('tool-unlock-popup'),
    unlocked_tool_title: document.getElementById('unlocked-tool-title'),
    unlocked_tool_description: document.getElementById('unlocked-tool-description'),
    unlocked_tool_cost: document.getElementById('unlocked-tool-cost'),
    unlocked_tool_benefit: document.getElementById('unlocked-tool-benefit'),
    close_tool_unlock_popup: document.getElementById('close-tool-unlock-popup'),
    acknowledge_tool_unlock: document.getElementById('acknowledge-tool-unlock'),
    // Toolkit elements
    toolkit_btn: document.getElementById('toolkit-btn'),
    toolkit_popup: document.getElementById('toolkit-popup'),
    toolkit_items: document.getElementById('toolkit-items'),
    close_toolkit_popup: document.getElementById('close-toolkit-popup'),
    popup_overlay: document.getElementById('popup-overlay'),
    // Main container for configuration
    game_container: document.getElementById('game-container')
};

// Game constants
const MAX_STAT = 100;  // Maximum value for resistance and usage scores

// Creates journey cards to display in the selection screen
function create_journey_cards(journeys) {
    const story_grid = document.querySelector('.story-grid');
    if (!story_grid) {
        console.error('Story grid element not found');
        return;
    }

    story_grid.innerHTML = '';

    journeys.forEach(journey => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.setAttribute('data-story', journey.id);

        card.innerHTML = `
            <div class="story-card-content">
                <div class="story-image">
                    <img src="${journey.image}" alt="${journey.title}">
                </div>
                <div class="story-info">
                    <h3>${journey.title}</h3>
                    <p>${journey.description}</p>
                    <button class="select-story-btn">Start Journey</button>
                </div>
            </div>
        `;

        story_grid.appendChild(card);
    });

    elements.journey_cards = document.querySelectorAll('.story-card');
    elements.journey_buttons = document.querySelectorAll('.select-story-btn');

    attach_journey_button_listeners();
}

// Attaches event listeners to journey selection buttons
function attach_journey_button_listeners() {
    elements.journey_buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const journey_card = e.target.closest('.story-card');
            if (journey_card) {
                const journey_id = journey_card.dataset.story;
                select_journey(journey_id);
            }
        });
    });
}

// Initializes the story selection screen
async function init_story_selection() {
    if (elements.exit_game_btn) {
        elements.exit_game_btn.classList.add('hidden');
    }

    try {
        const journeys = await load_available_journeys();
        create_journey_cards(journeys);
    } catch (error) {
        console.error('Error initializing story selection:', error);
        create_fallback_journey_cards();
    }
}

// Creates fallback journey cards if dynamic loading fails
function create_fallback_journey_cards() {
    const fallback_journeys = [
        {
            id: 'journey1',
            title: 'Journey 1',
            description: 'Default journey description. Begin your recovery path with this guided experience.',
            image: '../assets/images/bg-gradient-1.jpg'
        },
        {
            id: 'journey2',
            title: 'Journey 2',
            description: 'Another recovery journey option with different scenarios and challenges.',
            image: '../assets/images/bg-gradient-2.jpg'
        },
        {
            id: 'journey3',
            title: 'Journey 3',
            description: 'Explore recovery through various life situations and choices.',
            image: '../assets/images/bg-gradient-3.jpg'
        }
    ];

    create_journey_cards(fallback_journeys);
}

// Loads scene data from the appropriate JSON file
async function load_scene_data() {
    try {
        const journey_id = game_state.selected_journey || 'journey1';

        // Try different file naming patterns in order of preference
        const file_paths = [
            `../assets/js/journeys/${journey_id}.json`,
            `../assets/js/journeys/${journey_id.replace('journey', 'journey_')}.json`,
            `../assets/js/journeys/${journey_id.replace('journey_', 'journey')}.json`,
            `../assets/js/${journey_id}.json`,
            `../assets/js/journey1.json`
        ];

        // Try each path until one works
        for (const path of file_paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                console.log(`Journey file not found at: ${path}, trying next location...`);
            }
        }

        throw new Error(`Failed to load scenes data for ${journey_id} from any location`);
    } catch (error) {
        console.error('Error loading scene data:', error);
        show_error_message('Failed to load game data. Please refresh the page.');
        return {};
    }
}

// Finds and loads all available journey files
async function load_available_journeys() {
    try {
        const journeys = [];

        // Try both naming patterns (with and without underscore)
        const patterns = [
            { prefix: 'journey_', regex: /journey_(\d+)\.json/ },
            { prefix: 'journey', regex: /journey(\d+)\.json/ }
        ];

        const MAX_JOURNEYS = 10;

        // Fallback images
        const default_images = [
            '../assets/images/bg-gradient-1.jpg',
            '../assets/images/bg-gradient-2.jpg',
            '../assets/images/bg-gradient-3.jpg',
            '../assets/images/home-image.jpg'
        ];

        for (const pattern of patterns) {
            for (let i = 1; i <= MAX_JOURNEYS; i++) {
                try {
                    const journey_file = `${pattern.prefix}${i}.json`;
                    const paths = [
                        `../assets/js/journeys/${journey_file}`,
                        `../assets/js/${journey_file}`
                    ];

                    let journey_data = null;

                    for (const path of paths) {
                        try {
                            const response = await fetch(path);
                            if (response.ok) {
                                journey_data = await response.json();
                                break;
                            }
                        } catch (e) {
                            // Continue to next path
                        }
                    }

                    if (journey_data) {
                        const metadata = journey_data.metadata || {};
                        const default_image_index = (i - 1) % default_images.length;
                        const journey_id = `${pattern.prefix}${i}`;

                        // Check for duplicate journey (by number)
                        const existing_journey_index = journeys.findIndex(j => {
                            const existing_num = j.id.match(/\d+/)[0];
                            const current_num = i.toString();
                            return existing_num === current_num;
                        });

                        if (existing_journey_index >= 0) {
                            continue;
                        }

                        journeys.push({
                            id: journey_id,
                            title: metadata.title || `Journey ${i}`,
                            description: metadata.description || `Journey description ${i}`,
                            image: metadata.image || default_images[default_image_index],
                            file: journey_file
                        });
                    }
                } catch (error) {
                    console.log(`Journey ${i} not found with pattern ${pattern.prefix}, skipping.`);
                }
            }
        }

        if (journeys.length === 0) {
            console.warn('No journey files found, using fallback journeys.');
            return get_fallback_journeys();
        }

        return journeys;
    } catch (error) {
        console.error('Error loading journeys:', error);
        return get_fallback_journeys();
    }
}

// Returns fallback journey data if no journeys are found
function get_fallback_journeys() {
    return [
        {
            id: 'journey1',
            title: 'Journey 1',
            description: 'Default journey 1 description.',
            image: '../assets/images/bg-gradient-1.jpg',
            file: 'journey1.json'
        },
        {
            id: 'journey2',
            title: 'Journey 2',
            description: 'Default journey 2 description.',
            image: '../assets/images/bg-gradient-2.jpg',
            file: 'journey2.json'
        },
        {
            id: 'journey3',
            title: 'Journey 3',
            description: 'Default journey 3 description.',
            image: '../assets/images/bg-gradient-3.jpg',
            file: 'journey3.json'
        }
    ];
}

// Reads configuration settings from HTML data attributes
function read_config() {
    const resource_display = elements.game_container.dataset.resourceDisplay || 'popup';
    game_state.use_popup_resources = resource_display === 'popup';

    const dev_tools = elements.game_container.dataset.devTools || 'off';
    game_state.show_dev_tools = dev_tools === 'on';

    apply_dev_tools_visibility();
}

// Sets dev tools visibility based on configuration
function apply_dev_tools_visibility() {
    const dev_tools_element = document.getElementById('dev-tools');
    if (dev_tools_element) {
        if (game_state.show_dev_tools) {
            elements.game_container.setAttribute('data-dev-tools', 'on');
        } else {
            elements.game_container.setAttribute('data-dev-tools', 'off');
        }
    }
}

// Handles journey selection and starts the game
function select_journey(journey_id) {
    game_state.selected_journey = journey_id;

    elements.journey_select.classList.remove('active');
    elements.journey_select.classList.add('hidden');
    elements.game_play.classList.remove('hidden');
    elements.game_play.classList.add('active');

    elements.exit_game_btn.classList.remove('hidden');
    elements.toolkit_btn.classList.remove('hidden');

    start_game();
}

// Adds "Lorem Ipsum" prefix to scene titles
function format_scene_title(title) {
    if (title.startsWith('Lorem Ipsum')) {
        return title;
    }
    return `Lorem Ipsum ${title}`;
}

// Renders a scene with its content and choices
function render_scene(scene_data, id) {
    const scene = scene_data[id];
    if (!scene) {
        console.error(`Scene ID ${id} not found`);
        return;
    }

    elements.scene_title.textContent = format_scene_title(scene.title);
    elements.scene_narration.textContent = scene.narration;

    if (elements.route_id) elements.route_id.textContent = id;
    if (elements.scene_path) elements.scene_path.textContent = game_state.path.join(' → ');

    elements.choices_container.innerHTML = '';
    elements.feedback_container.innerHTML = '';
    elements.feedback_container.classList.remove('has-inline-resource');
    elements.continue_btn.classList.add('hidden');

    update_available_tools(scene);

    scene.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.label;
        button.onclick = () => select_choice(choice, scene_data, button);
        elements.choices_container.appendChild(button);
    });

    if (game_state.newly_unlocked_tool) {
        show_tool_unlock_popup(game_state.newly_unlocked_tool);
    }
}

// Updates available toolkit tools based on scene configuration
function update_available_tools(scene) {
    game_state.available_tools = [];

    if (scene.toolkit !== undefined) {
        if (scene.toolkit === false) {
            game_state.available_tools = [];
        }
        else if (Array.isArray(scene.toolkit)) {
            scene.toolkit.forEach(tool_id => {
                if (typeof tool_id === 'string' &&
                    game_state.master_toolkit &&
                    game_state.master_toolkit[tool_id] &&
                    game_state.unlocked_tools.includes(tool_id)) {

                    const master_tool = game_state.master_toolkit[tool_id];
                    const tool_instance = {
                        id: tool_id,
                        title: master_tool.title,
                        description: master_tool.description,
                        resist_cost: master_tool.default_resist_cost,
                        use_benefit: master_tool.default_use_benefit
                    };

                    game_state.available_tools.push(tool_instance);
                }
            });
        }
        else if (scene.toolkit === true) {
            if (game_state.master_toolkit) {
                game_state.unlocked_tools.forEach(tool_id => {
                    if (game_state.master_toolkit[tool_id]) {
                        const master_tool = game_state.master_toolkit[tool_id];
                        const tool_instance = {
                            id: tool_id,
                            title: master_tool.title,
                            description: master_tool.description,
                            resist_cost: master_tool.default_resist_cost,
                            use_benefit: master_tool.default_use_benefit
                        };

                        game_state.available_tools.push(tool_instance);
                    }
                });
            }
        }
    }

    // Update toolkit button visibility
    if (game_state.available_tools.length > 0) {
        elements.toolkit_btn.classList.remove('disabled');
        elements.toolkit_btn.title = "Open your recovery toolkit";
    } else {
        elements.toolkit_btn.classList.add('disabled');
        elements.toolkit_btn.title = "No toolkit items available in this scene";
    }
}

// Handles player selection of a choice
function select_choice(choice, scene_data, button_element) {
    game_state.pending_choice = choice;
    game_state.pending_scene_data = scene_data;

    const all_buttons = elements.choices_container.querySelectorAll('button');
    all_buttons.forEach(button => {
        button.classList.remove('selected');
        button.disabled = true;
        button.classList.add('disabled');
    });

    button_element.classList.add('selected');
    display_choice_feedback(choice);
    elements.continue_btn.classList.remove('hidden');
}

// Displays feedback for a selected choice (e.g., resources)
function display_choice_feedback(choice) {
    elements.feedback_container.innerHTML = '';
    elements.feedback_container.classList.remove('has-inline-resource');

    if (choice.resource_link) {
        if (game_state.use_popup_resources) {
            show_resource_popup(choice.resource_link);
        } else {
            show_inline_resource(choice.resource_link);
        }
    }
}

// Displays resource information inline under the choices
function show_inline_resource(resource) {
    elements.feedback_container.classList.add('has-inline-resource');

    const resource_container = document.createElement('div');
    resource_container.className = 'inline-resource';

    const title = document.createElement('h4');
    title.textContent = 'Helpful Resource:';
    resource_container.appendChild(title);

    const description = document.createElement('p');
    description.textContent = resource.description;
    resource_container.appendChild(description);

    const link = document.createElement('a');
    link.href = resource.url;
    link.textContent = resource.text;
    link.className = 'inline-resource-link';
    link.target = '_blank';
    resource_container.appendChild(link);

    elements.feedback_container.appendChild(resource_container);
}

// Displays a popup with resource information
function show_resource_popup(resource) {
    elements.resource_description.textContent = resource.description;
    elements.resource_link.href = resource.url;
    elements.resource_link.textContent = resource.text;

    elements.resource_popup.classList.add('active');
    elements.popup_overlay.classList.add('active');
}

// Closes the resource popup
function close_resource_popup() {
    elements.resource_popup.classList.remove('active');
    elements.popup_overlay.classList.remove('active');
}

// Processes the player's choice and advances to the next scene
function process_pending_choice() {
    if (!game_state.pending_choice || !game_state.pending_scene_data) {
        console.error('No pending choice to process');
        return;
    }

    const choice = game_state.pending_choice;
    const scene_data = game_state.pending_scene_data;

    check_for_unlocked_tools(choice);

    update_resist_stat(choice.resist_change || 0);
    update_use_stat(choice.use_change || 0);
    game_state.time += choice.time_advance || 0;

    // Update scene and path history
    game_state.current_scene = choice.next_scene_id;
    game_state.path.push(choice.next_scene_id);

    update_stats();
    close_resource_popup();

    const next_scene = scene_data[choice.next_scene_id];
    const ending = next_scene?.end;

    // Check game state outcomes. Some supplied journeys use "success" as
    // the positive ending label, so accept it as an alias for "win".
    if (game_state.resist <= 0 || ending === 'relapse') {
        trigger_relapse();
    } else if (ending === 'win' || ending === 'success') {
        trigger_win();
    } else if (!next_scene) {
        console.error(`Scene ID ${choice.next_scene_id} not found`);
        show_error_message('This journey path is unavailable. Please restart the journey and try another choice.');
    } else {
        game_state.pending_choice = null;
        game_state.pending_scene_data = null;
        elements.continue_btn.classList.add('hidden');
        render_scene(scene_data, choice.next_scene_id);
    }
}

// Updates resistance stat with cap logic
function update_resist_stat(change) {
    if (game_state.resist === MAX_STAT && change > 0) {
        return;
    }
    game_state.resist = Math.max(0, Math.min(MAX_STAT, game_state.resist + change));
}

// Updates usage urge stat with cap logic
function update_use_stat(change) {
    if (game_state.use === MAX_STAT && change > 0) {
        return;
    }
    game_state.use = Math.max(0, Math.min(MAX_STAT, game_state.use + change));
}

// Updates UI to reflect current game stats
function update_stats() {
    // Update text values
    elements.resist_score.textContent = game_state.resist;
    elements.use_score.textContent = game_state.use;

    // Update progress bars (width percentage)
    elements.resist_bar.style.width = `${game_state.resist}%`;
    elements.use_bar.style.width = `${game_state.use}%`;

    // Add warning colors for low resistance
    if (game_state.resist <= 20) {
        elements.resist_bar.classList.add('danger');
        elements.resist_score.classList.add('danger');
    } else {
        elements.resist_bar.classList.remove('danger');
        elements.resist_score.classList.remove('danger');
    }

    // Add warning colors for high use urge
    if (game_state.use >= 80) {
        elements.use_bar.classList.add('danger');
        elements.use_score.classList.add('danger');
    } else {
        elements.use_bar.classList.remove('danger');
        elements.use_score.classList.remove('danger');
    }

    // Format time display (e.g., "2d 5h" for 53 hours)
    let time_text = '';
    if (game_state.time >= 24) {
        const days = Math.floor(game_state.time / 24);
        const hours = game_state.time % 24;
        time_text = `${days}d ${hours}h`;
    } else {
        time_text = `${game_state.time}h`;
    }
    elements.time_display.textContent = time_text;
}

// Checks if player has relapsed (resist at 0)
function check_relapse() {
    return game_state.resist <= 0;
}

// Triggers the relapse end state
function trigger_relapse() {
    // Hide gameplay elements
    elements.choices_container.innerHTML = '';
    elements.feedback_container.innerHTML = '';
    elements.continue_btn.classList.add('hidden');

    // Show relapse message and restart button
    elements.outcome_message.innerHTML = `
        <h2>You've Relapsed</h2>
        <p>Your resistance has fallen to zero. Recovery is a journey with setbacks. Would you like to try again?</p>
    `;
    elements.outcome_message.classList.remove('hidden');
    elements.restart_btn.classList.remove('hidden');
}

// Triggers the win end state
function trigger_win() {
    // Hide gameplay elements
    elements.choices_container.innerHTML = '';
    elements.feedback_container.innerHTML = '';
    elements.continue_btn.classList.add('hidden');

    // Show win message and restart button
    elements.outcome_message.innerHTML = `
        <h2>Recovery Success</h2>
        <p>You've successfully navigated through this part of your recovery journey. Would you like to play again?</p>
    `;
    elements.outcome_message.classList.remove('hidden');
    elements.restart_btn.classList.remove('hidden');
}

// Shows an error message to the player
function show_error_message(message) {
    // Hide gameplay elements
    elements.choices_container.innerHTML = '';
    elements.feedback_container.innerHTML = '';
    elements.continue_btn.classList.add('hidden');

    // Show error message
    elements.outcome_message.innerHTML = `
        <h2>Error</h2>
        <p>${message}</p>
    `;
    elements.outcome_message.classList.remove('hidden');
    elements.restart_btn.classList.remove('hidden');
}

// Starts or restarts the game
async function start_game() {
    try {
        // Reset game state
        game_state.resist = 100;
        game_state.use = 100;
        game_state.time = 0;
        game_state.path = [];
        game_state.pending_choice = null;
        game_state.pending_scene_data = null;
        game_state.available_tools = [];
        game_state.unlocked_tools = [];
        game_state.newly_unlocked_tool = null;

        // Hide outcome elements
        elements.outcome_message.classList.add('hidden');
        elements.restart_btn.classList.add('hidden');

        // Load scene data from JSON file
        const scene_data = await load_scene_data();

        // Set initial values from scene data if available
        if (scene_data.initial_values) {
            game_state.resist = scene_data.initial_values.resist ?? 100;
            game_state.use = scene_data.initial_values.use ?? 100;

            // Initialize unlocked tools if specified
            if (Array.isArray(scene_data.initial_values.unlocked_tools)) {
                game_state.unlocked_tools = [...scene_data.initial_values.unlocked_tools];
            }
        }

        // Set initial scene and update stats
        game_state.current_scene = 'scene_001';
        game_state.path = ['scene_001'];
        update_stats();

        // Render the first scene
        render_scene(scene_data, 'scene_001');
    } catch (error) {
        console.error('Error starting game:', error);
        show_error_message('An error occurred while starting the game.');
    }
}

// Initializes the game
function init_game() {
    read_config();
    init_story_selection();

    // Set up event listeners
    elements.exit_game_btn.addEventListener('click', exit_game);
    elements.exit_game_btn.classList.add('hidden');
    elements.continue_btn.addEventListener('click', process_pending_choice);
    elements.restart_btn.addEventListener('click', start_game);
    elements.close_resource_popup.addEventListener('click', close_resource_popup);
    elements.toolkit_btn.addEventListener('click', show_toolkit_popup);
    elements.close_toolkit_popup.addEventListener('click', close_toolkit_popup);
    elements.close_tool_unlock_popup.addEventListener('click', close_tool_unlock_popup);
    elements.acknowledge_tool_unlock.addEventListener('click', close_tool_unlock_popup);

    // Popup overlay click handler
    elements.popup_overlay.addEventListener('click', (e) => {
        close_resource_popup();
        close_toolkit_popup();
        close_tool_unlock_popup();
    });

    // Load the master toolkit data
    load_master_toolkit();
}

// Exits the current journey and returns to journey selection
function exit_game() {
    // Reset game state
    game_state.current_scene = 'scene_001';
    game_state.resist = 100;
    game_state.use = 100;
    game_state.time = 0;
    game_state.path = [];
    game_state.pending_choice = null;
    game_state.pending_scene_data = null;

    // Hide game play, show journey selection
    elements.game_play.classList.remove('active');
    elements.game_play.classList.add('hidden');
    elements.journey_select.classList.remove('hidden');
    elements.journey_select.classList.add('active');

    // Hide buttons and popups
    elements.exit_game_btn.classList.add('hidden');
    elements.toolkit_btn.classList.add('hidden');
    close_resource_popup();
    close_toolkit_popup();
    elements.outcome_message.classList.add('hidden');
    elements.restart_btn.classList.add('hidden');
}

// Shows the toolkit popup with available tools
function show_toolkit_popup() {
    if (game_state.available_tools.length === 0) {
        return;
    }

    elements.toolkit_items.innerHTML = '';

    // Create items for each available tool
    game_state.available_tools.forEach(tool => {
        const item = document.createElement('div');
        item.className = 'toolkit-item';
        item.dataset.toolId = tool.id;

        const info_div = document.createElement('div');
        info_div.className = 'toolkit-item-info';

        const title = document.createElement('h4');
        title.className = 'toolkit-item-title';
        title.textContent = tool.title;
        info_div.appendChild(title);

        const description = document.createElement('p');
        description.className = 'toolkit-item-description';
        description.textContent = tool.description;
        info_div.appendChild(description);

        item.appendChild(info_div);

        const stats_div = document.createElement('div');
        stats_div.className = 'toolkit-item-stats';

        const resist_cost = document.createElement('span');
        resist_cost.className = 'toolkit-resist-cost';
        resist_cost.textContent = `Resist: -${tool.resist_cost}`;
        stats_div.appendChild(resist_cost);

        const use_benefit = document.createElement('span');
        use_benefit.className = 'toolkit-use-benefit';
        use_benefit.textContent = `Use: -${tool.use_benefit}`;
        stats_div.appendChild(use_benefit);

        item.appendChild(stats_div);
        item.addEventListener('click', () => use_tool(tool));
        elements.toolkit_items.appendChild(item);
    });

    elements.toolkit_popup.classList.add('active');
    elements.popup_overlay.classList.add('active');
}

// Closes the toolkit popup
function close_toolkit_popup() {
    elements.toolkit_popup.classList.remove('active');
    elements.popup_overlay.classList.remove('active');
}

// Uses a toolkit item to adjust stats
function use_tool(tool) {
    if (game_state.resist <= tool.resist_cost) {
        alert(`You don't have enough resistance to use ${tool.title}`);
        return;
    }

    update_resist_stat(-tool.resist_cost);
    update_use_stat(-tool.use_benefit);
    update_stats();
    close_toolkit_popup();

    // Show feedback about the tool usage
    const feedback = document.createElement('div');
    feedback.className = 'toolkit-feedback';
    feedback.innerHTML = `
        <h4>Tool Used: ${tool.title}</h4>
        <p>${tool.description}</p>
        <p><span class="toolkit-resist-cost">Resistance: -${tool.resist_cost}</span> | 
           <span class="toolkit-use-benefit">Urge to Use: -${tool.use_benefit}</span></p>
    `;

    elements.feedback_container.innerHTML = '';
    elements.feedback_container.classList.add('has-inline-resource');
    elements.feedback_container.appendChild(feedback);
}

// Loads the master toolkit data
async function load_master_toolkit() {
    try {
        const response = await fetch('../assets/js/master_journey_toolkit.json');

        if (!response.ok) {
            throw new Error('Failed to load master toolkit data');
        }

        const data = await response.json();
        game_state.master_toolkit = data.tools;
        console.log('Master toolkit loaded successfully');
    } catch (error) {
        console.error('Error loading master toolkit:', error);
        // Initialize with empty toolkit instead of default tools
        game_state.master_toolkit = {};
        show_error_message('Failed to load toolkit data. Some game features may be unavailable.');
    }
}

// Closes the tool unlock popup
function close_tool_unlock_popup() {
    elements.tool_unlock_popup.classList.remove('active');

    if (!elements.resource_popup.classList.contains('active') &&
        !elements.toolkit_popup.classList.contains('active')) {
        elements.popup_overlay.classList.remove('active');
    }

    game_state.newly_unlocked_tool = null;
}

// Checks if a choice unlocks a new tool
function check_for_unlocked_tools(choice) {
    if (!choice.unlock_tool) return;

    const tool_id = choice.unlock_tool;

    if (typeof tool_id === 'string' &&
        game_state.master_toolkit &&
        game_state.master_toolkit[tool_id] &&
        !game_state.unlocked_tools.includes(tool_id)) {

        game_state.unlocked_tools.push(tool_id);

        game_state.newly_unlocked_tool = {
            id: tool_id,
            ...game_state.master_toolkit[tool_id]
        };
    }
}

// Displays the tool unlock popup
function show_tool_unlock_popup(tool) {
    if (!tool) return;

    elements.unlocked_tool_title.textContent = tool.title;
    elements.unlocked_tool_description.textContent = tool.description;
    elements.unlocked_tool_cost.textContent = tool.default_resist_cost;
    elements.unlocked_tool_benefit.textContent = tool.default_use_benefit;

    elements.tool_unlock_popup.classList.add('active');
    elements.popup_overlay.classList.add('active');
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init_game);
