// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    updateThemeIcon();
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const theme = body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', theme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    if (body.classList.contains('light-theme')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Notes Management
class NotesManager {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNote = null;
        this.currentView = 'notes';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderNotes();
    }

    setupEventListeners() {
        // New Note Button
        document.getElementById('newNoteBtn').addEventListener('click', () => {
            this.createNewNote();
        });

        // Save Note Button
        document.getElementById('saveNoteBtn').addEventListener('click', () => {
            this.saveNote();
        });

        // Cancel Note Button
        document.getElementById('cancelNoteBtn').addEventListener('click', () => {
            this.hideEditor();
        });

        // Search
        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.filterNotes(e.target.value);
        });

        // Sidebar Navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.page;
                this.setCurrentView(view);
            });
        });
    }

    createNewNote() {
        this.currentNote = {
            id: Date.now(),
            title: '',
            content: '',
            date: new Date().toISOString(),
            favorite: false
        };
        this.showEditor();
    }

    showEditor() {
        document.querySelector('.note-editor').style.display = 'block';
        document.querySelector('.page-content').style.display = 'none';
        
        const titleInput = document.querySelector('.editor-title');
        const contentInput = document.querySelector('.editor-textarea');
        
        if (this.currentNote) {
            titleInput.value = this.currentNote.title || '';
            contentInput.value = this.currentNote.content || '';
        }
    }

    hideEditor() {
        document.querySelector('.note-editor').style.display = 'none';
        document.querySelector('.page-content').style.display = 'block';
        this.currentNote = null;
    }

    saveNote() {
        const titleInput = document.querySelector('.editor-title');
        const contentInput = document.querySelector('.editor-textarea');
        
        if (!this.currentNote) {
            this.currentNote = {
                id: Date.now(),
                title: '',
                content: '',
                date: new Date().toISOString(),
                favorite: false
            };
        }

        this.currentNote.title = titleInput.value;
        this.currentNote.content = contentInput.value;
        this.currentNote.date = new Date().toISOString();

        const existingNoteIndex = this.notes.findIndex(note => note.id === this.currentNote.id);
        if (existingNoteIndex !== -1) {
            this.notes[existingNoteIndex] = this.currentNote;
        } else {
            this.notes.push(this.currentNote);
        }

        localStorage.setItem('notes', JSON.stringify(this.notes));
        this.hideEditor();
        this.renderNotes();
    }

    deleteNote(noteId) {
        if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
            this.notes = this.notes.filter(note => note.id !== noteId);
            localStorage.setItem('notes', JSON.stringify(this.notes));
            this.renderNotes();
        }
    }

    toggleFavorite(noteId) {
        const note = this.notes.find(note => note.id === noteId);
        if (note) {
            note.favorite = !note.favorite;
            localStorage.setItem('notes', JSON.stringify(this.notes));
            this.renderNotes();
        }
    }

    filterNotes(searchTerm) {
        const filteredNotes = this.notes.filter(note => {
            const searchLower = searchTerm.toLowerCase();
            return note.title.toLowerCase().includes(searchLower) ||
                   note.content.toLowerCase().includes(searchLower);
        });
        this.renderNotes(filteredNotes);
    }

    setCurrentView(view) {
        this.currentView = view;
        document.querySelectorAll('.sidebar-nav li').forEach(li => {
            li.classList.remove('active');
        });
        document.querySelector(`[data-page="${view}"]`).parentElement.classList.add('active');
        
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById(`${view}-page`).style.display = 'block';
        
            this.renderNotes();
    }

    renderNotes(notesToRender = null) {
        const notes = notesToRender || this.notes;
        const notesGrid = document.querySelector(`#${this.currentView}-page .notes-grid`);
        if (!notesGrid) return;

        notesGrid.innerHTML = '';

        const filteredNotes = notes.filter(note => {
            if (this.currentView === 'favorites') {
                return note.favorite;
            }
            return true;
        });

        filteredNotes.forEach(note => {
            const noteCard = this.createNoteCard(note);
            notesGrid.appendChild(noteCard);
        });
    }

    createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.dataset.id = note.id;

        const date = new Date(note.date);
        const formattedDate = this.formatDate(date);

        card.innerHTML = `
            <div class="note-header">
                <h3>${note.title || 'Без названия'}</h3>
                <div class="note-actions">
                    <button class="favorite-btn ${note.favorite ? 'active' : ''}" title="Добавить в избранное">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="menu-btn" title="Меню">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="note-content">
                <p>${note.content || 'Нет содержимого'}</p>
            </div>
            <div class="note-footer">
                <div class="note-date">${formattedDate}</div>
            </div>
        `;

        // Add event listeners
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(note.id);
            card.querySelector('.favorite-btn').classList.toggle('active');
        });

        card.querySelector('.menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showContextMenu(e, note);
        });

        card.addEventListener('click', () => {
            this.currentNote = note;
            this.showEditor();
        });

        return card;
    }

    showContextMenu(event, note) {
        const contextMenu = document.querySelector('.context-menu');
        contextMenu.style.display = 'block';
        
        // Calculate center position
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;
        
        // Position in the center of the screen
        contextMenu.style.left = `${(windowWidth - menuWidth) / 2}px`;
        contextMenu.style.top = `${(windowHeight - menuHeight) / 2}px`;

        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'context-menu-overlay';
        document.body.appendChild(overlay);

        const menuItems = contextMenu.querySelectorAll('.context-menu-item');
        menuItems.forEach(item => {
            item.onclick = () => {
                contextMenu.style.display = 'none';
                overlay.remove();
                if (item.dataset.action === 'edit') {
                    this.currentNote = note;
                    this.showEditor();
                } else if (item.dataset.action === 'delete') {
                    this.deleteNote(note.id);
                }
            };
        });

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
                overlay.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const day = 24 * 60 * 60 * 1000;

        if (diff < day) {
            return 'Сегодня';
        } else if (diff < 2 * day) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
const notesManager = new NotesManager();
});

// Добавление стилей для уведомлений
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 4px;
        color: white;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: var(--success-color);
    }

    .notification.error {
        background-color: var(--error-color);
    }

    .error-message {
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }

    input.error,
    textarea.error {
        border-color: var(--error-color);
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 

// Page Management
const pages = {
    all: document.getElementById('notes-page'),
    favorites: document.getElementById('favorites-page')
};

const navLinks = {
    all: document.querySelector('[data-page="notes"]'),
    favorites: document.querySelector('[data-page="favorites"]')
};

// Initialize pages
function initPages() {
    // Hide all pages except the active one
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    
    // Show the active page
    const activePage = localStorage.getItem('activePage') || 'all';
    showPage(activePage);
    
    // Set active nav link
    setActiveNavLink(activePage);
}

// Show specific page
function showPage(pageName) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        if (page) page.style.display = 'none';
    });
    
    // Show selected page
    if (pages[pageName]) {
        pages[pageName].style.display = 'block';
        localStorage.setItem('activePage', pageName);
    }
    
    // Update active nav link
    setActiveNavLink(pageName);
}

// Set active nav link
function setActiveNavLink(pageName) {
    Object.values(navLinks).forEach(link => {
        if (link) {
            link.parentElement.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.parentElement.classList.add('active');
            }
        }
    });
}

// Event Listeners for Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Initialize pages
    initPages();
    
    // Add click event listeners to nav links
    Object.entries(navLinks).forEach(([pageName, link]) => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(pageName);
            });
        }
    });
});

// Tags Management
function initTags() {
    const tagsList = document.querySelector('.tags-list');
    if (!tagsList) return;
    
    // Load tags from localStorage
    const tags = JSON.parse(localStorage.getItem('tags')) || [];
    
    // Clear existing tags
    tagsList.innerHTML = '<h3>Теги</h3>';
    
    // Add tags to the list
    tags.forEach(tag => {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.innerHTML = `
            <span class="tag-name">${tag.name}</span>
            <span class="tag-count">${tag.count}</span>
        `;
        tagItem.addEventListener('click', () => showTaggedNotes(tag.name));
        tagsList.appendChild(tagItem);
    });
}

// Show notes with specific tag
function showTaggedNotes(tagName) {
    const taggedNotes = document.querySelector('.tagged-notes');
    if (!taggedNotes) return;
    
    // Update selected tag display
    const selectedTag = document.querySelector('.selected-tag');
    if (selectedTag) {
        selectedTag.textContent = tagName;
    }
    
    // Load notes with this tag
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const taggedNotesList = notes.filter(note => note.tags && note.tags.includes(tagName));
    
    // Display tagged notes
    displayNotes(taggedNotesList);
}

// Archive Management
function initArchive() {
    const archiveSort = document.querySelector('.archive-sort');
    const archivePeriod = document.querySelector('.archive-period');
    
    if (archiveSort) {
        archiveSort.addEventListener('change', () => {
            const sortBy = archiveSort.value;
            const period = archivePeriod ? archivePeriod.value : 'all';
            loadArchivedNotes(sortBy, period);
        });
    }
    
    if (archivePeriod) {
        archivePeriod.addEventListener('change', () => {
            const sortBy = archiveSort ? archiveSort.value : 'date';
            const period = archivePeriod.value;
            loadArchivedNotes(sortBy, period);
        });
    }
}

// Load archived notes with sorting and filtering
function loadArchivedNotes(sortBy = 'date', period = 'all') {
    const notes = JSON.parse(localStorage.getItem('notes')) || [];
    const archivedNotes = notes.filter(note => note.archived);
    
    // Apply period filter
    let filteredNotes = archivedNotes;
    if (period !== 'all') {
        const now = new Date();
        filteredNotes = archivedNotes.filter(note => {
            const noteDate = new Date(note.date);
            switch (period) {
                case 'week':
                    return now - noteDate <= 7 * 24 * 60 * 60 * 1000;
                case 'month':
                    return now - noteDate <= 30 * 24 * 60 * 60 * 1000;
                case 'year':
                    return now - noteDate <= 365 * 24 * 60 * 60 * 1000;
                default:
                    return true;
            }
        });
    }
    
    // Apply sorting
    filteredNotes.sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(b.date) - new Date(a.date);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    // Display filtered and sorted notes
    displayNotes(filteredNotes);
}

// Notes Display Management
function displayNotes(notes = null) {
    const notesToDisplay = notes || JSON.parse(localStorage.getItem('notes')) || [];
    const notesGrid = document.querySelector('#notes-page .notes-grid');
    
    if (!notesGrid) return;

    // Clear existing notes
    notesGrid.innerHTML = '';

    // Display notes
    notesToDisplay.forEach(note => {
        const noteElement = createNoteElement(note);
        notesGrid.appendChild(noteElement);
    });

    // Update notes count
    const notesCount = document.querySelector('#notes-page .page-description');
    if (notesCount) {
        notesCount.textContent = `${notesToDisplay.length} заметок`;
    }
}

// Create note element
function createNoteElement(note) {
    const noteElement = document.createElement('div');
    noteElement.className = 'note-card';
    noteElement.dataset.id = note.id;

    const date = new Date(note.date);
    const formattedDate = formatDate(date);

    noteElement.innerHTML = `
        <div class="note-header">
            <h3>${note.title || 'Без названия'}</h3>
            <div class="note-actions">
                <button class="btn-icon delete" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-content">
            <p>${note.content || 'Нет содержимого'}</p>
        </div>
        <div class="note-footer">
            <div class="note-date">${formattedDate}</div>
        </div>
    `;

    // Add event listeners
    noteElement.addEventListener('click', (e) => {
        if (!e.target.closest('.note-actions')) {
            showEditor(note);
        }
    });

    // Delete button
    noteElement.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
    });

    return noteElement;
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) {
        return 'Сегодня';
    } else if (diff < 2 * day) {
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Search functionality
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        
        const filteredNotes = notes.filter(note => {
            const title = note.title?.toLowerCase() || '';
            const content = note.content?.toLowerCase() || '';
            
            return title.includes(searchTerm) || content.includes(searchTerm);
        });
        
        displayNotes(filteredNotes);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show notes page by default
    showPage('notes');
    initTags();
    initArchive();
    initSearch();
    displayNotes();

    // Add click handler for logo
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.style.display = 'none';
            });
            // Show home page
            document.getElementById('home-page').style.display = 'block';
        });
    }
}); 