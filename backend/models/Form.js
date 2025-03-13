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
    unterhaltspflicht: Boolean,
    unterhaltArt: String, // 'barunterhalt', 'naturalunterhalt', 'kein'
    unterhaltHoehe: String,
    geburtsdatum: String,
    beschaeftigungsArt: String,
    befristet: Boolean,
    selbststaendig: Boolean,
    warSelbststaendig: Boolean,
    erlernterBeruf: String,
    derzeitigeTaetigkeit: String,
    rechtsform: String,
    nettoEinkommen: String,
    zusatzEinkommen: String,
    
    // Immobilien
    immobilien: Boolean,
    immobilienDetails: String,
    immobilieAusland: Boolean,
    
    // Vermögenswerte
    bankguthaben: String,
    sparbuch: Boolean,
    sparbuchWert: String,
    lebensversicherung: Boolean,
    lebensversicherungWert: String,
    bausparvertrag: Boolean,
    bausparvertragWert: String,
    rentenversicherung: Boolean,
    rentenversicherungWert: String,
    weitereVermoegen: Boolean,
    weitereVermoegenDetails: String,
    
    // Fahrzeug
    fahrzeuge: Boolean,
    fahrzeugWert: String,
    fahrzeugFinanziert: Boolean,
    fahrzeugKreditsumme: String,
    fahrzeugbriefBank: Boolean,
    fahrzeugNotwendig: Boolean,
    
    // Schenkungen
    schenkungAngehoerige: Boolean,
    schenkungAngehoerigeDetails: String,
    schenkungAndere: Boolean,
    schenkungAndereDetails: String,
    
    // Sonstiges
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
    bearbeitungStart: {
        type: String,
        default: '1'
    },
    bearbeitungMonat: {
        type: String,
        default: ''
    },
    abrechnungStart: {
        type: String,
        default: '1'
    },
    abrechnungMonat: {
        type: String,
        default: ''
    },
    manuellerPreis: {
        type: Boolean,
        default: false
    },
    manuellerPreisBetrag: {
        type: String,
        default: ''
    },
    manuellerPreisNotiz: {
        type: String,
        default: ''
    },
    notizen: String // Neues Notizfeld
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema);