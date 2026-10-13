// Preserve the existing Make payload contract while moving webhook addresses to secrets.
function buildUpdatePayload(updatedForm) {
    const { berechnungsart, startgebuehr, preisProGlaeubiger, standardPrice, pfandungsPrice,
        gesamtPreis, ratenzahlung: { monate, monatsRate } } = updatedForm.preisKalkulation;
    const anzahlGlaeubiger = parseInt(updatedForm.glaeubiger) || 0;
    return {
                ...updatedForm.toObject(),
                preisKalkulation: {
                    berechnungsart,
                    manuell: updatedForm.manuellerPreis || false,
                    manuellerPreisBetrag: updatedForm.manuellerPreisBetrag || "",
                    manuellerPreisNotiz: updatedForm.manuellerPreisNotiz || "",
                    startgebuehr,
                    preisProGlaeubiger,
                    anzahlGlaeubiger,
                    standardPrice,
                    pfandungsPrice,
                    gesamtPreis,
                    ratenzahlung: {
                        monate,
                        monatsRate
                    }
                },
                persoenlicheDaten: {
                    vorname: updatedForm.vorname || '',
                    nachname: updatedForm.nachname || '',
                    familienstand: updatedForm.familienstand || '',
                    geburtsdatum: updatedForm.geburtsdatum || '',
                    geburtsort: updatedForm.geburtsort || '',
                    strasse: updatedForm.strasse || '',
                    hausnummer: updatedForm.hausnummer || '',
                    wohnort: updatedForm.wohnort || '',
                    plz: updatedForm.plz || ''
                },
                unterhalt: {
                    unterhaltspflicht: updatedForm.unterhaltspflicht || false,
                    unterhaltArt: updatedForm.unterhaltArt || '',
                    kinderAnzahl: updatedForm.kinderAnzahl || ''
                },
                einkommensverhaeltnis: {
                    beschaeftigungsArt: updatedForm.beschaeftigungsArt || '',
                    nettoEinkommen: updatedForm.nettoEinkommen || '',
                    nebenbeschaeftigung: updatedForm.nebenbeschaeftigung || '',
                    nebenbeschaeftigungBemerkung: updatedForm.nebenbeschaeftigungBemerkung || '',
                    zusatzEinkommen: updatedForm.zusatzEinkommen || '',
                    zusatzEinkommenBemerkung: updatedForm.zusatzEinkommenBemerkung || ''
                },
                berufserfahrung: {
                    erlernterBeruf: updatedForm.erlernterBeruf || '',
                    derzeitigeTaetigkeit: updatedForm.derzeitigeTaetigkeit || ''
                },
                sonstigeAngaben: {
                    warSelbststaendig: updatedForm.warSelbststaendig || false,
                    warSelbststaendigBemerkung: updatedForm.warSelbststaendigBemerkung || '',
                    sbGemeldetAbgemeldet: updatedForm.sbGemeldetAbgemeldet || '',
                    sbGemeldetAbgemeldetBemerkung: updatedForm.sbGemeldetAbgemeldetBemerkung || '',
                    selbststaendig: updatedForm.selbststaendig || false
                },
                immobilien: {
                    vorhanden: updatedForm.immobilien || false,
                    details: updatedForm.immobilienDetails || '',
                    bemerkung: updatedForm.immobilienBemerkung || '',
                    ausland: updatedForm.immobilieAusland || false
                },
                fahrzeug: {
                    vorhanden: updatedForm.fahrzeuge || false,
                    wert: updatedForm.fahrzeugWert || '',
                    finanzierungArt: updatedForm.fahrzeugFinanzierungArt || '',
                    finanziert: updatedForm.fahrzeugFinanziert || false,
                    kreditsumme: updatedForm.fahrzeugKreditsumme || '',
                    briefBeiBank: updatedForm.fahrzeugbriefBank || false,
                    notwendig: updatedForm.fahrzeugNotwendig || false,
                    arbeitsweg: updatedForm.fahrzeugArbeitsweg || false,
                    arbeitswegKm: updatedForm.fahrzeugArbeitswegKm || ''
                },
                vermoegenAnAngehoerige: {
                    zweiJahre: updatedForm.vermoegenAngehoerige2Jahre || false,
                    zweiJahreBetrag: updatedForm.vermoegenAngehoerige2JahreBetrag || '',
                    vierJahre: updatedForm.vermoegenAngehoerige4Jahre || false,
                    vierJahreBetrag: updatedForm.vermoegenAngehoerige4JahreBetrag || ''
                },
                vermoegen: {
                    sparbuch: {
                        vorhanden: updatedForm.sparbuch || false,
                        wert: updatedForm.sparbuchWert || ''
                    },
                    investDepotGeldanlagen: {
                        vorhanden: updatedForm.investDepotGeldanlagen || false,
                        wert: updatedForm.investDepotGeldanlagenWert || ''
                    },
                    lebensversicherung: {
                        vorhanden: updatedForm.lebensversicherung || false,
                        wert: updatedForm.lebensversicherungWert || '',
                        rueckkaufwert: updatedForm.lebensversicherungRueckkaufwert || ''
                    },
                    bausparvertrag: {
                        vorhanden: updatedForm.bausparvertrag || false,
                        wert: updatedForm.bausparvertragWert || '',
                        rueckkaufwert: updatedForm.bausparvertragRueckkaufwert || ''
                    },
                    rentenversicherung: {
                        vorhanden: updatedForm.rentenversicherung || false,
                        wert: updatedForm.rentenversicherungWert || '',
                        rueckkaufwert: updatedForm.rentenversicherungRueckkaufwert || ''
                    },
                    weitere: {
                        vorhanden: updatedForm.weitereVermoegen || false,
                        details: updatedForm.weitereVermoegenDetails || '',
                        bemerkung: updatedForm.weitereVermoegenBemerkung || ''
                    }
                },
                schulden: {
                    gesamtSchulden: updatedForm.gesamtSchulden || '',
                    gesamtSchuldenBemerkung: updatedForm.gesamtSchuldenBemerkung || '',
                    hausbank: updatedForm.hausbank || '',
                    dispo: updatedForm.dispo || '',
                    dispoBemerkung: updatedForm.dispoBemerkung || '',
                    pKonto: updatedForm.pKonto || false,
                    pKontoBemerkung: updatedForm.pKontoBemerkung || '',
                    kontoWechselEmpfohlen: updatedForm.kontoWechselEmpfohlen || false,
                    kontoWechselEmpfohlenBemerkung: updatedForm.kontoWechselEmpfohlenBemerkung || '',
                    glaeubiger: updatedForm.glaeubiger || '',
                    forderungenOeffentlich: updatedForm.forderungenOeffentlich || '',
                    forderungenPrivat: updatedForm.forderungenPrivat || '',
                    schuldenartInfo: updatedForm.schuldenartInfo || '',
                    schuldenartInfoBemerkung: updatedForm.schuldenartInfoBemerkung || '',
                    vorherigeInsolvenz: updatedForm.vorherigeInsolvenz || false,
                    vorherigeInsolvenzBemerkung: updatedForm.vorherigeInsolvenzBemerkung || ''
                },
                mandatsInfo: {
                    entschuldungsart: updatedForm.entschuldungsart || '',
                    ratenzahlungMonate: updatedForm.ratenzahlungMonate || '2'
                },
                schenkungen: {
                    anAngehoerige: {
                        vorhanden: updatedForm.schenkungAngehoerige || false,
                        details: updatedForm.schenkungAngehoerigeDetails || ''
                    },
                    anAndere: {
                        vorhanden: updatedForm.schenkungAndere || false,
                        details: updatedForm.schenkungAndereDetails || ''
                    }
                },
                zustellung: {
                    perPost: updatedForm.zustellungPost || false,
                    perEmail: updatedForm.zustellungEmail || false
                },
                terminierung: {
                    bearbeitungStart: updatedForm.bearbeitungStart || '1',
                    bearbeitungMonat: updatedForm.bearbeitungMonat || '',
                    abrechnungStart: updatedForm.abrechnungStart || '1',
                    abrechnungMonat: updatedForm.abrechnungMonat || ''
                },
                qualifizierungsStatus: updatedForm.qualifiziert || false,
                notizen: updatedForm.notizen || ''
    };
}
module.exports = { buildUpdatePayload };
