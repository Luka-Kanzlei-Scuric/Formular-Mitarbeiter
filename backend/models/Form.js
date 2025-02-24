const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    leadName: {
        type: String,
        required: true
    },
    zustellungPost: {
        type: Boolean,
        default: false
    },
    zustellungEmail: {
        type: Boolean,
        default: false
    },
    qualifiziert: {
        type: Boolean,
        default: false
    },
    // Füge hier alle anderen Felder hinzu:
    familienstand: String,
    strasse: String,
    hausnummer: String,
    wohnort: String,
    plz: String,
    kinderAnzahl: String,
    kinderAlter: String,
    unterhaltspflicht: String,
    unterhaltHoehe: String,
    beschaeftigungsArt: String,
    befristet: Boolean,
    selbststaendig: Boolean,
    rechtsform: String,
    nettoEinkommen: String,
    zusatzEinkommen: String,
    immobilien: Boolean,
    immobilienDetails: String,
    bankguthaben: String,
    fahrzeuge: Boolean,
    fahrzeugWert: String,
    lebensversicherung: Boolean,
    versicherungWert: String,
    sonstigeVermoegen: String,
    gesamtSchulden: String,
    glaeubiger: String,
    forderungenOeffentlich: String,
    forderungenPrivat: String,
    vorherigeInsolvenz: Boolean,
    insolvenzDatum: String,
    aktuelePfaendung: Boolean,
    pfaendungDetails: String,
    ratenzahlungMonate: String,
    benutzerdefinierteMonate: String,
    bearbeitungStart: {
        type: String,
        default: '1'
    },
    abrechnungStart: {
        type: String,
        default: '1'
    },
    notizen: String // Neues Notizfeld
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema);