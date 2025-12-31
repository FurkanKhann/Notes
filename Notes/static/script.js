// Global variables
let currentFolderId = null;
let currentFolderName = '';
let currentNoteId = null;
let notes = [];

// Make functions globally accessible
window.summarizeExistingNote = summarizeExistingNote;
window.openEditNoteModal = openEditNoteModal;
window.deleteNote = deleteNote;
window.selectFolder = selectFolder;
window.createFolder = createFolder;
window.deleteFolder = deleteFolder;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.openNoteModal = openNoteModal;
window.closeNoteModal = closeNoteModal;
window.saveNote = saveNote;
window.formatText = formatText;
window.changeTextColor = changeTextColor;
window.changeHighlight = changeHighlight;
window.summarizeNote = summarizeNote;
window.updatePreview = updatePreview;
window.copySummary = copySummary;
window.insertSummary = insertSummary;
window.openCustomizeModal = openCustomizeModal;
window.closeCustomizeModal = closeCustomizeModal;
window.setBackground = setBackground;

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
    }
});

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// Create folder
async function createFolder() {
    const folderName = document.getElementById('newFolderName').value.trim();
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/create_folder';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'name';
    input.value = folderName;
    
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
}

// Select folder
async function selectFolder(folderId, folderName) {
    currentFolderId = folderId;
    currentFolderName = folderName;
    
    // Update UI with personalized message
    document.querySelector('.current-folder-name').textContent = folderName;
    const greetingEl = document.querySelector('.topbar-greeting');
    if (greetingEl) {
        greetingEl.textContent = `What would you like to store today, Miss Sadqua? 💝`;
    }
    document.getElementById('fabButton').style.display = 'flex';
    
    // Highlight selected folder
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    // Load notes
    await loadNotes(folderId);
}

// Load notes for a folder
async function loadNotes(folderId) {
    try {
        const response = await fetch(`/get_notes/${folderId}`);
        notes = await response.json();
        
        renderNotes();
    } catch (error) {
        console.error('Error loading notes:', error);
        alert('Failed to load notes');
    }
}

// Render notes
function renderNotes() {
    const container = document.getElementById('notesContainer');
    
    if (notes.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">📝</div>
                <h2>No notes yet, Sadqua! 💕</h2>
                <p>Click the + button to create your first beautiful note</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notes.map(note => {
        // Strip HTML tags for preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content || '';
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        return `
            <div class="note-card" 
                 style="background-color: ${note.color || '#fff8dc'}; font-family: ${note.font || 'Quicksand'}, sans-serif;">
                <div class="note-card-header">
                    <div class="note-card-title">${escapeHtml(note.title || 'Untitled')}</div>
                    <div class="note-card-actions">
                        <button class="note-action-btn" onclick="event.stopPropagation(); summarizeExistingNote('${note.id}')" title="AI Summary">
                            ✨
                        </button>
                        <button class="note-action-btn" onclick="event.stopPropagation(); openEditNoteModal('${note.id}')" title="Edit">
                            ✏️
                        </button>
                        <button class="note-action-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="note-card-content" onclick="openEditNoteModal('${note.id}')">${escapeHtml(textContent)}</div>
                <div class="note-card-footer">
                    ${formatDate(note.created_at)}
                </div>
            </div>
        `;
    }).join('');
}

// Open new note modal
function openNoteModal() {
    if (!currentFolderId) {
        alert('Please select a folder first');
        return;
    }
    
    currentNoteId = null;
    document.getElementById('modalTitle').textContent = 'New Note';
    document.getElementById('noteTitle').value = '';
    const editor = document.getElementById('noteContent');
    editor.innerHTML = '';
    document.getElementById('noteColor').value = '#fff8dc';
    document.getElementById('noteFont').value = 'Quicksand';
    
    updatePreview();
    
    const modal = document.getElementById('noteModal');
    modal.classList.add('active');
    
    // Focus on title
    setTimeout(() => {
        document.getElementById('noteTitle').focus();
    }, 100);
}

// Open edit note modal
function openEditNoteModal(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    currentNoteId = noteId;
    document.getElementById('modalTitle').textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title || '';
    const editor = document.getElementById('noteContent');
    editor.innerHTML = note.content || '';
    document.getElementById('noteColor').value = note.color || '#fff8dc';
    document.getElementById('noteFont').value = note.font || 'Quicksand';
    
    updatePreview();
    
    const modal = document.getElementById('noteModal');
    modal.classList.add('active');
}

// Close note modal
function closeNoteModal() {
    const modal = document.getElementById('noteModal');
    modal.classList.remove('active');
    currentNoteId = null;
}

// Update preview
function updatePreview() {
    const color = document.getElementById('noteColor').value;
    const font = document.getElementById('noteFont').value;
    const content = document.getElementById('noteContent');
    
    content.style.backgroundColor = color;
    content.style.fontFamily = `${font}, sans-serif`;
}

// Save note
async function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const editor = document.getElementById('noteContent');
    const content = editor.innerHTML.trim();
    const color = document.getElementById('noteColor').value;
    const font = document.getElementById('noteFont').value;
    
    // Check if content is empty (accounting for empty HTML tags)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!title && !textContent.trim()) {
        alert('Please enter a title or content');
        return;
    }
    
    const noteData = {
        title: title || 'Untitled',
        content: content,
        color: color,
        font: font,
        folder_id: currentFolderId
    };
    
    try {
        if (currentNoteId) {
            // Update existing note
            const response = await fetch(`/update_note/${currentNoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            
            if (response.ok) {
                showHearts();
                closeNoteModal();
                await loadNotes(currentFolderId);
            } else {
                alert('Failed to update note');
            }
        } else {
            // Create new note
            const response = await fetch('/create_note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteData)
            });
            
            if (response.ok) {
                showHearts();
                closeNoteModal();
                await loadNotes(currentFolderId);
            } else {
                alert('Failed to create note');
            }
        }
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    }
}

// Rich Text Formatting Functions
function formatText(command) {
    const editor = document.getElementById('noteContent');
    
    // Make sure editor is focused
    editor.focus();
    
    // Small delay to ensure focus
    setTimeout(() => {
        if (command === 'heading') {
            document.execCommand('formatBlock', false, '<h2>');
        } else if (command === 'bullet') {
            document.execCommand('insertUnorderedList', false, null);
        } else if (command === 'number') {
            document.execCommand('insertOrderedList', false, null);
        } else if (command === 'strikethrough') {
            document.execCommand('strikeThrough', false, null);
        } else {
            // For bold, italic, underline
            document.execCommand(command, false, null);
        }
        
        // Keep focus on editor
        editor.focus();
        
        // Update toolbar button states
        updateToolbarState();
    }, 10);
}

function updateToolbarState() {
    // Update button active states based on current formatting
    const commands = ['bold', 'italic', 'underline', 'strikethrough'];
    
    commands.forEach(cmd => {
        const isActive = document.queryCommandState(cmd);
        const button = document.querySelector(`[onclick*="formatText('${cmd}')"]`);
        
        if (button) {
            if (isActive) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

// Update toolbar state on selection change
document.addEventListener('selectionchange', () => {
    const editor = document.getElementById('noteContent');
    if (editor && document.activeElement === editor) {
        updateToolbarState();
    }
});

function changeTextColor() {
    const color = document.getElementById('textColor').value;
    const editor = document.getElementById('noteContent');
    
    // Focus editor first
    editor.focus();
    
    // Get selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // Apply color
    document.execCommand('foreColor', false, color);
    
    // Keep focus
    editor.focus();
}

function changeHighlight() {
    const color = document.getElementById('highlightColor').value;
    const editor = document.getElementById('noteContent');
    
    // Focus editor first
    editor.focus();
    
    // Get selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    // Apply highlight
    document.execCommand('hiliteColor', false, color);
    
    // Keep focus
    editor.focus();
}

// AI Summarizer Function
async function summarizeNote() {
    const editor = document.getElementById('noteContent');
    const content = editor.innerText || editor.textContent;
    
    if (!content.trim()) {
        alert('Please write some content first to summarize!');
        return;
    }
    
    // Show loading state
    const summaryBtn = document.querySelector('.summary-btn');
    const originalText = summaryBtn.innerHTML;
    summaryBtn.innerHTML = '<span>✨ Generating...</span>';
    summaryBtn.disabled = true;
    
    try {
        const response = await fetch('/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        
        const data = await response.json();
        
        if (response.ok && data.summary) {
            // Show summary in a nice modal
            showSummaryModal(data.summary);
        } else {
            alert(data.error || 'Failed to generate summary. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate summary. Please check your connection.');
    } finally {
        // Restore button
        summaryBtn.innerHTML = originalText;
        summaryBtn.disabled = false;
    }
}

// Summarize existing note from card
async function summarizeExistingNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content || '';
    const content = tempDiv.textContent || tempDiv.innerText || '';
    
    if (!content.trim()) {
        alert('This note has no content to summarize!');
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-icon">✨</div>
            <p>Generating AI Summary...</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    try {
        const response = await fetch('/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        
        const data = await response.json();
        
        if (response.ok && data.summary) {
            showSummaryModal(data.summary, note.title);
        } else {
            alert(data.error || 'Failed to generate summary. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate summary. Please check your connection.');
    } finally {
        loadingDiv.remove();
    }
}

function showSummaryModal(summary, noteTitle = '') {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'summary-modal';
    
    const titleText = noteTitle ? `Summary of "${escapeHtml(noteTitle)}"` : '✨ AI Summary';
    
    modal.innerHTML = `
        <div class="summary-modal-content">
            <div class="summary-modal-header">
                <h3>${titleText}</h3>
                <button onclick="this.closest('.summary-modal').remove()" class="summary-close">×</button>
            </div>
            <div class="summary-modal-body">
                <div class="summary-text">${escapeHtml(summary)}</div>
            </div>
            <div class="summary-modal-footer">
                <button onclick="copySummary(\`${escapeHtml(summary).replace(/`/g, '\\`')}\`)" class="btn-secondary">
                    📋 Copy Summary
                </button>
                <button onclick="insertSummary(\`${escapeHtml(summary).replace(/`/g, '\\`')}\`); this.closest('.summary-modal').remove();" class="btn-primary">
                    ➕ Insert into Note
                </button>
                <button onclick="this.closest('.summary-modal').remove()" class="btn-secondary">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function copySummary(summary) {
    navigator.clipboard.writeText(summary).then(() => {
        alert('Summary copied to clipboard! 📋');
    });
}

function insertSummary(summary) {
    const editor = document.getElementById('noteContent');
    
    // Check if modal is open (we're editing a note)
    const modal = document.getElementById('noteModal');
    if (modal && modal.classList.contains('active')) {
        editor.focus();
        
        // Insert summary at the beginning with a header
        const summaryHTML = `<h3>📝 Summary</h3><p><em>${escapeHtml(summary)}</em></p><hr><br>`;
        
        if (editor.innerHTML.trim() === '' || editor.innerHTML === '<br>') {
            editor.innerHTML = summaryHTML;
        } else {
            editor.innerHTML = summaryHTML + editor.innerHTML;
        }
        
        alert('Summary inserted! 💖');
    } else {
        // If we're viewing a note card, just copy it
        copySummary(summary);
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_note/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadNotes(currentFolderId);
        } else {
            alert('Failed to delete note');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note');
    }
}

// Delete folder
async function deleteFolder(folderId) {
    if (!confirm('Are you sure you want to delete this folder? All notes inside will be deleted.')) {
        return;
    }
    
    try {
        const response = await fetch(`/delete_folder/${folderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            window.location.reload();
        } else {
            alert('Failed to delete folder');
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder');
    }
}

// Show hearts animation
function showHearts() {
    const hearts = ['💗', '💖', '💕', '💓', '💝', '💞', '💘'];
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart-burst';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = Math.random() * window.innerWidth + 'px';
            heart.style.top = Math.random() * window.innerHeight + 'px';
            
            document.body.appendChild(heart);
            
            setTimeout(() => heart.remove(), 2000);
        }, i * 100);
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('noteModal');
    if (modal && e.target === modal) {
        closeNoteModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('noteModal');
        if (modal && modal.classList.contains('active')) {
            closeNoteModal();
        }
        const customizeModal = document.getElementById('customizeModal');
        if (customizeModal && customizeModal.classList.contains('active')) {
            closeCustomizeModal();
        }
    }
    
    // Ctrl/Cmd + S to save note
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const modal = document.getElementById('noteModal');
        if (modal && modal.classList.contains('active')) {
            e.preventDefault();
            saveNote();
        }
    }
    
    // Rich text shortcuts when editor is focused
    const editor = document.getElementById('noteContent');
    if (editor && document.activeElement === editor) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            formatText('bold');
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            formatText('italic');
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            formatText('underline');
        }
    }
});

// Background Customization Functions
function openCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    modal.classList.add('active');
    
    // Highlight current background
    const currentBg = localStorage.getItem('backgroundClass') || 'default';
    document.querySelectorAll('.bg-option').forEach(opt => {
        opt.classList.remove('active');
    });
    const activeOption = document.querySelector(`.bg-option.${currentBg}`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
}

function closeCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    modal.classList.remove('active');
}

function setBackground(type, className) {
    const mainContent = document.querySelector('.main-content');
    
    // Remove all background classes
    mainContent.className = 'main-content';
    
    // Add new background class
    if (type !== 'default') {
        mainContent.classList.add(`bg-${className}`);
        localStorage.setItem('backgroundType', type);
        localStorage.setItem('backgroundClass', className);
    } else {
        localStorage.removeItem('backgroundType');
        localStorage.removeItem('backgroundClass');
    }
    
    // Update active state
    document.querySelectorAll('.bg-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    if (type !== 'default') {
        const activeOption = document.querySelector(`.bg-option.${className}`);
        if (activeOption) {
            activeOption.classList.add('active');
        }
    }
    
    // Show success message
    showNotification('Background updated! 🎨');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Load saved background on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
    }
    
    // Load saved background
    const savedType = localStorage.getItem('backgroundType');
    const savedClass = localStorage.getItem('backgroundClass');
    if (savedType && savedClass) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add(`bg-${savedClass}`);
        }
    }
});
