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
        required: true,
        index: true // Index für die Suche nach Namen hinzugefügt
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
    
    // 1. Persönliche Daten
    vorname: String,
    nachname: String,
    familienstand: String, // 'verheiratet', 'geschieden', 'getrennt lebend', 'ledig'
    strasse: String,
    hausnummer: String,
    wohnort: String,
    plz: String,
    geburtsdatum: String,
    geburtsort: String, // Neu hinzugefügt
    kinderAnzahl: String,
    kinderAlter: String,
    unterhaltspflicht: Boolean,
    unterhaltArt: String, // 'barunterhalt', 'naturalunterhalt', 'kein'
    unterhaltHoehe: String,
    
    // 2. Einkommensverhältnis
    beschaeftigungsArt: String, // 'in Arbeit', 'Rentner', 'Arbeitslos', 'Bürgergeld', 'Selbstständig'
    befristet: Boolean,
    selbststaendig: Boolean,
    nettoEinkommen: String,
    nebenbeschaeftigung: String, // Neu hinzugefügt
    nebenbeschaeftigungBemerkung: String, // Neu hinzugefügt
    zusatzEinkommen: String,
    zusatzEinkommenBemerkung: String, // Neu hinzugefügt
    
    // 3. Berufserfahrung
    erlernterBeruf: String,
    derzeitigeTaetigkeit: String, // Ausgeübter Beruf
    rechtsform: String,
    
    // 4. Sonstige Angaben
    warSelbststaendig: Boolean,
    warSelbststaendigBemerkung: String, // Neu hinzugefügt
    sbGemeldetAbgemeldet: String, // Neu hinzugefügt
    sbGemeldetAbgemeldetBemerkung: String, // Neu hinzugefügt
    
    // 5. Vermögenssituation
    // Immobilien
    immobilien: Boolean,
    immobilienDetails: String,
    immobilienBemerkung: String, // Neu hinzugefügt
    immobilieAusland: Boolean,
    
    // Fahrzeug
    fahrzeuge: Boolean,
    fahrzeugWert: String,
    fahrzeugFinanziert: Boolean,
    fahrzeugFinanzierungArt: String, // Neu hinzugefügt - 'Miete', 'Leasing', 'Finanzierung', 'Firmenwagen'
    fahrzeugKreditsumme: String,
    fahrzeugbriefBank: Boolean,
    fahrzeugNotwendig: Boolean,
    fahrzeugArbeitsweg: Boolean, // Neu hinzugefügt
    fahrzeugArbeitswegKm: String, // Neu hinzugefügt
    
    // Vermögen an Angehörige
    vermoegenAngehoerige2Jahre: Boolean, // Neu hinzugefügt
    vermoegenAngehoerige2JahreBetrag: String, // Neu hinzugefügt
    vermoegenAngehoerige4Jahre: Boolean, // Neu hinzugefügt
    vermoegenAngehoerige4JahreBetrag: String, // Neu hinzugefügt
    
    // Schenkungen
    schenkungAngehoerige: Boolean,
    schenkungAngehoerigeDetails: String,
    schenkungAndere: Boolean,
    schenkungAndereDetails: String,
    
    // Vermögenswerte
    bankguthaben: String,
    sparbuch: Boolean,
    sparbuchWert: String,
    investDepotGeldanlagen: Boolean, // Neu hinzugefügt
    investDepotGeldanlagenWert: String, // Neu hinzugefügt
    lebensversicherung: Boolean,
    lebensversicherungWert: String,
    lebensversicherungRueckkaufwert: String, // Neu hinzugefügt
    bausparvertrag: Boolean,
    bausparvertragWert: String,
    bausparvertragRueckkaufwert: String, // Neu hinzugefügt
    rentenversicherung: Boolean,
    rentenversicherungWert: String,
    rentenversicherungRueckkaufwert: String, // Neu hinzugefügt
    weitereVermoegen: Boolean,
    weitereVermoegenDetails: String,
    weitereVermoegenBemerkung: String, // Neu hinzugefügt
    
    // 6. Schuldensituation
    gesamtSchulden: String,
    gesamtSchuldenBemerkung: String, // Neu hinzugefügt
    hausbank: String, // Neu hinzugefügt
    dispo: String, // Neu hinzugefügt
    dispoBemerkung: String, // Neu hinzugefügt
    pKonto: Boolean, // Neu hinzugefügt
    pKontoBemerkung: String, // Neu hinzugefügt
    pKontoName: String, // P-Konto-Bescheinigung Name
    pKontoGeburtsdatum: String, // P-Konto-Bescheinigung Geburtsdatum
    pKontoAdresse: String, // P-Konto-Bescheinigung Adresse
    pKontoHausbank: String, // P-Konto-Bescheinigung Hausbank
    pKontoBemerkungen: String, // P-Konto-Bescheinigung Bemerkungen
    kontoWechselEmpfohlen: Boolean, // Neu hinzugefügt
    kontoWechselEmpfohlenBemerkung: String, // Neu hinzugefügt
    glaeubiger: String,
    forderungenOeffentlich: String,
    forderungenPrivat: String,
    schuldenartInfo: String, // Neu hinzugefügt - 'Privatrechtliche', 'öffentlich rechtlich'
    schuldenartInfoBemerkung: String, // Neu hinzugefügt
    vorherigeInsolvenz: Boolean,
    insolvenzDatum: String,
    vorherigeInsolvenzBemerkung: String, // Neu hinzugefügt
    aktuelePfaendung: Boolean,
    pfaendungDetails: String,
    
    // 7. Mandatsinformationen
    entschuldungsart: String, // Neu hinzugefügt - 'InsO', 'Vergleich'
    ratenzahlungMonate: String, // '1', '2', '3', '4', '5', '6'
    benutzerdefinierteMonate: String,
    bearbeitungStart: {
        type: String,
        default: '1' // '1', '15'
    },
    bearbeitungMonat: {
        type: String,
        default: ''
    },
    abrechnungStart: {
        type: String,
        default: '1' // '1', '15'
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
    
    // Honorarinformation
    preisKalkulation: {
        berechnungsart: {
            type: String,
            default: 'nach Gläubiger' // 'manuell', 'nach Pfändung', 'nach Gläubiger'
        },
        startgebuehr: {
            type: Number,
            default: 799
        },
        preisProGlaeubiger: {
            type: Number,
            default: 39
        },
        standardPrice: {
            type: Number,
            default: 0
        },
        pfandungsPrice: {
            type: Number,
            default: 0
        },
        gesamtPreis: {
            type: Number,
            default: 0
        },
        ratenzahlung: {
            monate: {
                type: Number,
                default: 2
            },
            monatsRate: {
                type: Number,
                default: 0
            }
        }
    },
    
    notizen: String // Neues Notizfeld
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema);