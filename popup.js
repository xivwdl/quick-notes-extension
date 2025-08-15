import { t } from './localization.js';

document.addEventListener('DOMContentLoaded', function() {
    const noteInput = document.getElementById('noteInput');
    const saveNoteBtn = document.getElementById('saveNote');
    const showNotesBtn = document.getElementById('showNotes');
    const searchInput = document.getElementById('searchInput');
    const noteList = document.getElementById('noteList');
    const backToMainBtn = document.getElementById('backToMain');
    const mainView = document.getElementById('mainView');
    const notesView = document.getElementById('notesView');
    const noteDetailsView = document.getElementById('noteDetailsView');
    const noteDetailsContainer = document.getElementById('noteDetailsContainer');
    const backToNotesBtn = document.getElementById('backToNotes');
    const editNoteView = document.getElementById('editNoteView');
    const editNoteInput = document.getElementById('editNoteInput');
    const saveEditedNoteBtn = document.getElementById('saveEditedNote');
    const cancelEditNoteBtn = document.getElementById('cancelEditNote');
    const openSettingsFromMainBtn = document.getElementById('openSettingsFromMain');
    const openSettingsFromNotesBtn = document.getElementById('openSettingsFromNotes');
    const settingsView = document.getElementById('settingsView');
    const backFromSettingsBtn = document.getElementById('backFromSettings');
    const exportNotesBtn = document.getElementById('exportNotes');
    let editingNoteIndex = -1;
    let editNoteMde;

    let notes = [];
    let notesById = new Map();
    let lastView = 'main';
    let activeAreaName = 'local';
    let simplemde;

    // Storage helpers
    function getStorageByAreaName(areaName) {
        return chrome.storage.local;
    }

    function generateNoteKey() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    }

    function getAllNoteKeys(areaName, callback) {
        const storage = getStorageByAreaName(areaName);
        storage.get(null, (all) => {
            const keys = Object.keys(all || {}).filter(k => k.startsWith('note_'));
            callback(keys);
        });
    }

    function readAllNotes(areaName, callback) {
        const storage = getStorageByAreaName(areaName);
        storage.get(null, (all) => {
            const entries = Object.entries(all || {}).filter(([k, v]) => k.startsWith('note_') && v && typeof v === 'object');
            const result = entries.map(([id, data]) => ({ id, text: data.text, date: data.date }));
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
            callback(result);
        });
    }

    function writeNote(areaName, note, callback) {
        const storage = getStorageByAreaName(areaName);
        const key = note.id || generateNoteKey();
        const value = { text: note.text, date: note.date || new Date().toISOString() };
        storage.set({ [key]: value }, () => callback && callback({ id: key, ...value }));
    }

    function removeNote(areaName, noteId, callback) {
        const storage = getStorageByAreaName(areaName);
        storage.remove(noteId, () => callback && callback());
    }

    function clearAllNotes(areaName, callback) {
        getAllNoteKeys(areaName, (keys) => {
            if (keys.length === 0) return callback && callback();
            const storage = getStorageByAreaName(areaName);
            storage.remove(keys, () => callback && callback());
        });
    }

    function copyAllNotes(sourceArea, destinationArea, callback) {
        readAllNotes(sourceArea, (list) => {
            clearAllNotes(destinationArea, () => {
                if (list.length === 0) return callback && callback();
                const obj = {};
                list.forEach(n => { obj[n.id] = { text: n.text, date: n.date }; });
                const dest = getStorageByAreaName(destinationArea);
                dest.set(obj, () => callback && callback());
            });
        });
    }

    function runMigrationIfNeeded(callback) {
        chrome.storage.local.get(['migrationDone', 'notes'], (res) => {
            const alreadyMigrated = !!res.migrationDone;
            const legacy = Array.isArray(res.notes) ? res.notes : null;
            if (alreadyMigrated || !legacy) {
                return callback && callback();
            }
            getAllNoteKeys('local', (existingKeys) => {
                if (existingKeys.length > 0) {
                    chrome.storage.local.set({ migrationDone: true }, () => callback && callback());
                    return;
                }
                const toSet = {};
                legacy.forEach((n, idx) => {
                    const id = generateNoteKey() + '_' + idx;
                    toSet[id] = { text: n.text, date: n.date };
                });
                chrome.storage.local.set(toSet, () => {
                    const newKeys = Object.keys(toSet);
                    chrome.storage.local.get(newKeys, (after) => {
                        const ok = Object.keys(after || {}).length === newKeys.length;
                        if (ok) {
                            chrome.storage.local.remove('notes', () => {
                                chrome.storage.local.set({ migrationDone: true }, () => callback && callback());
                            });
                        } else {
                            callback && callback();
                        }
                    });
                });
            });
        });
    }

    function refreshNotes(callback) {
        readAllNotes(activeAreaName, (list) => {
            notes = list;
            notesById = new Map(list.map(n => [n.id, n]));
            callback && callback();
        });
    }

    // Initialization SimpleMDE
    setTimeout(() => {
        try {
            if (typeof SimpleMDE === 'undefined') {
                throw new Error('SimpleMDE is not loaded');
            }
            simplemde = new SimpleMDE({ 
                element: noteInput,
                spellChecker: false,
                status: false,
                toolbar: [
                    "bold", "italic", "heading", "|", 
                    "unordered-list", "ordered-list", "|", 
                    "link", "|", "preview",
                    {
                        name: "guide",
                        action: "https://simplemde.com/markdown-guide",
                        className: "fa fa-question-circle",
                        title: "Markdown Guide",
                        default: true
                    }
                ]
            });
        } catch (error) {
            console.error('Error initializing SimpleMDE:', error);
            // Fallback to basic textarea if SimpleMDE fails to load
            noteInput.style.display = 'block';
        }
    }, 100);

    // Startup: migrate, load sync status, then load notes
    runMigrationIfNeeded(() => {
        refreshNotes(() => {});
    });

    // Saving a note (to active storage)
    saveNoteBtn.addEventListener('click', function() {
        const noteText = simplemde && typeof simplemde.value === 'function' ? simplemde.value() : (noteInput.value || '');
        if (noteText.trim() !== '') {
            writeNote(activeAreaName, { text: noteText }, (saved) => {
                if (simplemde && typeof simplemde.value === 'function') simplemde.value('');
                refreshNotes(displayNotes);
            });
        }
    });

    // Show a list of notes
    showNotesBtn.addEventListener('click', function() {
        mainView.classList.add('hidden');
        notesView.classList.remove('hidden');
        displayNotes();
    });

    // Go back to the main screen
    backToMainBtn.addEventListener('click', function() {
        mainView.classList.remove('hidden');
        notesView.classList.add('hidden');
    });

    // Search for notes
    searchInput.addEventListener('input', function() {
        displayNotes();
    });

    // Showing notes
    function displayNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredNotes = notes.filter(note => {
            const firstLine = note.text
                .split('\n')[0]
                .replace(/^[#*_`]+/, '')
                .replace(/[#*_`]+$/, '')
                .trim()
                .toLowerCase();
            return firstLine.includes(searchTerm);
        });

        // Sort notes by date (from new to old)
        filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

        noteList.innerHTML = '';
        filteredNotes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            
            // Extract the first line and remove Markdown symbols
            const firstLine = note.text
                .split('\n')[0]
                .replace(/^[#*_`]+/, '')  // Remove Markdown symbols at the start
                .replace(/[#*_`]+$/, '')  // Remove Markdown symbols at the end
                .trim();

            const noteDate = new Date(note.date);
            const formattedDate = new Intl.DateTimeFormat(navigator.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: navigator.language.startsWith('en')
            }).format(noteDate);
            
            noteElement.innerHTML = `
                <div class="note-first-line" title="${firstLine}">${firstLine}</div>
                <div class="note-date">${formattedDate}</div>
            `;
            
            noteElement.addEventListener('click', () => showNoteDetails(note.id));
            noteList.appendChild(noteElement);
        });
    }

    // Show the details of the note
    function showNoteDetails(noteId) {
        const note = notesById.get(noteId);
        if (!note) return;
        const noteDate = new Date(note.date);
        const formattedDate = new Intl.DateTimeFormat(navigator.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: navigator.language.startsWith('en')
        }).format(noteDate);
        
        document.getElementById('noteDate').textContent = `${t('note')}: ${formattedDate}`;
        
        const noteContent = document.getElementById('noteContent');
        noteContent.innerHTML = '';
        
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = note.text;
        noteContent.appendChild(tempTextarea);
        
        const viewerMde = new SimpleMDE({
            element: tempTextarea,
            spellChecker: false,
            status: false,
            toolbar: false,
            readOnly: true
        });
        
        viewerMde.togglePreview();

        document.getElementById('editNote').onclick = () => editNote(note.id);
        document.getElementById('deleteNote').onclick = () => deleteNoteById(note.id);

        notesView.classList.add('hidden');
        noteDetailsView.classList.remove('hidden');
    }

    // Editing a note
    function editNote(noteId) {
        const note = notesById.get(noteId);
        if (!note) return;
        editingNoteIndex = noteId;
        
        editNoteInput.value = note.text;
        
        noteDetailsView.classList.add('hidden');
        editNoteView.classList.remove('hidden');
        
        // Initializing Simple MODE for editing
        if (!editNoteMde) {
            editNoteMde = new SimpleMDE({ 
                element: editNoteInput,
                spellChecker: false,
                status: false,
                toolbar: [
                    "bold", "italic", "heading", "|", 
                    "unordered-list", "ordered-list", "|", 
                    "link", "|", "preview",
                    {
                        name: "guide",
                        action: "https://simplemde.com/markdown-guide",
                        className: "fa fa-question-circle",
                        title: "Markdown Guide",
                        default: true
                    }
                ]
            });
        } else {
            editNoteMde.value(note.text);
        }
    }

    // Deleting notes
    function deleteNoteById(noteId) {
        if (confirm(t('deleteConfirm'))) {
            removeNote(activeAreaName, noteId, function() {
                noteDetailsView.classList.add('hidden');
                notesView.classList.remove('hidden');
                refreshNotes(displayNotes);
            });
        }
    }

    saveEditedNoteBtn.addEventListener('click', function() {
        if (editingNoteIndex !== -1) {
            const editedText = editNoteMde && typeof editNoteMde.value === 'function' ? editNoteMde.value() : editNoteInput.value;
            const noteId = editingNoteIndex;
            const updated = { id: noteId, text: editedText, date: new Date().toISOString() };
            writeNote(activeAreaName, updated, function() {
                editNoteView.classList.add('hidden');
                notesView.classList.remove('hidden');
                editingNoteIndex = -1;
                refreshNotes(displayNotes);
            });
        }
    });

    cancelEditNoteBtn.addEventListener('click', function() {
        editNoteView.classList.add('hidden');
        notesView.classList.remove('hidden');
        editingNoteIndex = -1;
    });

    backToNotesBtn.addEventListener('click', function() {
        noteDetailsView.classList.add('hidden');
        notesView.classList.remove('hidden');
    });

    function localizeInterface() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = t(key);
        });
    }

    localizeInterface();

    // Settings navigation
    function showSettings(fromView) {
        lastView = fromView || 'main';
        if (lastView === 'notes') {
            notesView.classList.add('hidden');
        } else {
            mainView.classList.add('hidden');
        }
        settingsView.classList.remove('hidden');
    }
    function hideSettings() {
        settingsView.classList.add('hidden');
        if (lastView === 'notes') {
            notesView.classList.remove('hidden');
            displayNotes();
        } else {
            mainView.classList.remove('hidden');
        }
    }

    if (openSettingsFromMainBtn) openSettingsFromMainBtn.addEventListener('click', () => showSettings('main'));
    if (openSettingsFromNotesBtn) openSettingsFromNotesBtn.addEventListener('click', () => showSettings('notes'));
    if (backFromSettingsBtn) backFromSettingsBtn.addEventListener('click', hideSettings);

    // Export all notes
    if (exportNotesBtn) {
        exportNotesBtn.addEventListener('click', function() {
            readAllNotes(activeAreaName, (list) => {
                const zip = new JSZip();
                list.forEach((note, index) => {
                    const fileName = `note_${new Date(note.date).toISOString().replace(/:/g, '-')}.md`;
                    const content = `---\nDate: ${note.date}\n---\n\n${note.text}\n\n`;
                    zip.file(fileName, content);
                });

                zip.generateAsync({type:"blob", compression: "DEFLATE"})
                    .then(function(content) {
                        saveAs(content, "quick_notes_export.zip");
                    })
                    .catch(function(error) {
                        console.error("Error generating zip:", error);
                        alert(t('exportError'));
                    });
            });
        });
    }
});