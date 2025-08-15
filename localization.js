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
        'deleteConfirm': 'Are you sure you want to delete this note?',
        'settings': 'Settings',
        'exportAll': 'Export all notes',
        'export': 'Export',
        'exportError': 'Error exporting notes. Please try again.',
        'createdBy': 'made by d1ma'
    },
    'ru': {
        'save': 'Сохранить',
        'showNotes': 'Показать заметки',
        'back': 'Назад',
        'search': 'Поиск заметок...',
        'edit': 'Редактировать',
        'delete': 'Удалить',
        'cancel': 'Отмена',
        'note': 'Заметка',
        'deleteConfirm': 'Вы уверены, что хотите удалить эту заметку?',
        'settings': 'Настройки',
        'exportAll': 'Экспортировать все заметки',
        'export': 'Экспорт',
        'exportError': 'Ошибка экспорта заметок. Пожалуйста, попробуйте снова.',
        'createdBy': 'made by d1ma'
    },
    'de': {
        'save': 'Speichern',
        'showNotes': 'Notizen anzeigen',
        'back': 'Zurück',
        'search': 'Notizen suchen...',
        'edit': 'Bearbeiten',
        'delete': 'Löschen',
        'cancel': 'Abbrechen',
        'note': 'Notiz',
        'deleteConfirm': 'Möchten Sie diese Notiz wirklich löschen?',
        'settings': 'Einstellungen',
        'exportAll': 'Alle Notizen exportieren',
        'export': 'Exportieren',
        'exportError': 'Fehler beim Exportieren der Notizen. Bitte versuchen Sie es erneut.',
        'createdBy': 'made by d1ma'
    },
    'es': {
        'save': 'Guardar',
        'showNotes': 'Mostrar notas',
        'back': 'Atrás',
        'search': 'Buscar notas...',
        'edit': 'Editar',
        'delete': 'Eliminar',
        'cancel': 'Cancelar',
        'note': 'Nota',
        'deleteConfirm': '¿Está seguro de que desea eliminar esta nota?',
        'settings': 'Ajustes',
        'exportAll': 'Exportar todas las notas',
        'export': 'Exportar',
        'exportError': 'Error al exportar notas. Por favor, inténtelo de nuevo.',
        'createdBy': 'made by d1ma'
    },
    'fr': {
        'save': 'Enregistrer',
        'showNotes': 'Afficher les notes',
        'back': 'Retour',
        'search': 'Rechercher des notes...',
        'edit': 'Modifier',
        'delete': 'Supprimer',
        'cancel': 'Annuler',
        'note': 'Note',
        'deleteConfirm': 'Voulez-vous vraiment supprimer cette note ?',
        'settings': 'Paramètres',
        'exportAll': 'Exporter toutes les notes',
        'export': 'Exporter',
        'exportError': 'Erreur lors de l\'exportation des notes. Veuillez réessayer.',
        'createdBy': 'made by d1ma'
    },
    'it': {
        'save': 'Salva',
        'showNotes': 'Mostra note',
        'back': 'Indietro',
        'search': 'Cerca note...',
        'edit': 'Modifica',
        'delete': 'Elimina',
        'cancel': 'Annulla',
        'note': 'Nota',
        'deleteConfirm': 'Sei sicuro di voler eliminare questa nota?',
        'settings': 'Impostazioni',
        'exportAll': 'Esporta tutte le note',
        'export': 'Esporta',
        'exportError': 'Errore durante l\'esportazione delle note. Riprova.',
        'createdBy': 'made by d1ma'
    }
};

const userLanguage = navigator.language.split('-')[0];
const currentLanguage = translations[userLanguage] ? userLanguage : 'en';

function t(key) {
    return translations[currentLanguage][key] || key;
}

export { t };
