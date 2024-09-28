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
    let editingNoteIndex = -1;
    let editNoteMde;

    let notes = [];
    let simplemde;

    // Инициализация SimpleMDE
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

    // Загрузка заметок при открытии
    chrome.storage.local.get(['notes'], function(result) {
        notes = result.notes || [];
    });

    // Сохранение заметки
    saveNoteBtn.addEventListener('click', function() {
        const noteText = simplemde.value();
        if (noteText.trim() !== '') {
            const newNote = {
                text: noteText,
                date: new Date().toISOString()
            };
            notes.unshift(newNote);
            chrome.storage.local.set({ notes: notes }, function() {
                simplemde.value('');
            });
        }
    });

    // Показать список заметок
    showNotesBtn.addEventListener('click', function() {
        mainView.classList.add('hidden');
        notesView.classList.remove('hidden');
        displayNotes();
    });

    // Вернуться к главному экрану
    backToMainBtn.addEventListener('click', function() {
        mainView.classList.remove('hidden');
        notesView.classList.add('hidden');
    });

    // Поиск заметок
    searchInput.addEventListener('input', function() {
        displayNotes();
    });

    // Отображение заеток
    function displayNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredNotes = notes.filter(note => 
            note.text.toLowerCase().includes(searchTerm)
        );

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
            
            noteElement.addEventListener('click', () => showNoteDetails(index));
            noteList.appendChild(noteElement);
        });
    }

    // Показать детали заметк
    function showNoteDetails(index) {
        const note = notes[index];
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

        document.getElementById('editNote').onclick = () => editNote(index);
        document.getElementById('deleteNote').onclick = () => deleteNote(index);

        notesView.classList.add('hidden');
        noteDetailsView.classList.remove('hidden');
    }

    // Редактирование заметки
    function editNote(index) {
        const note = notes[index];
        editingNoteIndex = index;
        
        editNoteInput.value = note.text;
        
        noteDetailsView.classList.add('hidden');
        editNoteView.classList.remove('hidden');
        
        // Инициализация SimpleMDE для редактирования
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

    // Удаление змек
    function deleteNote(index) {
        if (confirm(t('deleteConfirm'))) {
            notes.splice(index, 1);
            chrome.storage.local.set({ notes: notes }, function() {
                noteDetailsView.classList.add('hidden');
                notesView.classList.remove('hidden');
                displayNotes();
            });
        }
    }

    saveEditedNoteBtn.addEventListener('click', function() {
        if (editingNoteIndex !== -1) {
            const editedText = editNoteMde.value();
            notes[editingNoteIndex].text = editedText;
            notes[editingNoteIndex].date = new Date().toISOString();
            
            chrome.storage.local.set({ notes: notes }, function() {
                editNoteView.classList.add('hidden');
                notesView.classList.remove('hidden');
                displayNotes();
                editingNoteIndex = -1;
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
});