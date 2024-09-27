const translations = {
    'en': {
        'save': 'Save',
        'showNotes': 'Show Notes',
        'back': 'Back',
        'search': 'Search notes...',
        'edit': 'Edit',
        'delete': 'Delete',
        'cancel': 'Cancel',
        'note': 'Note',
        'deleteConfirm': 'Are you sure you want to delete this note?'
    },
    'ru': {
        'save': 'Сохранить',
        'showNotes': 'Показать заметки',
        'back': 'Назад',
        'search': 'Поиск заметок...',
        'edit': 'Редактировать',
        'delete': 'Удалить',
        'cancel': 'Отменить',
        'note': 'Заметка',
        'deleteConfirm': 'Вы уверены, что хотите удалить эту заметку?'
    }
};

const userLanguage = navigator.language.split('-')[0];
const currentLanguage = translations[userLanguage] ? userLanguage : 'en';

function t(key) {
    return translations[currentLanguage][key] || key;
}

export { t };
