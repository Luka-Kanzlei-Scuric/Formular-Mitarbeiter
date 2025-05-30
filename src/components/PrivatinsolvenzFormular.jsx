
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getPfaendungsbetrag } from '../lib/pfaendungsberechnung';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

const ErrorDisplay = ({ error }) => (
    <div className="p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold">Fehler beim Laden des Formulars:</h2>
        <pre className="mt-2">{error.message}</pre>
    </div>
);

const PrivatinsolvenzFormular = () => {
    const { taskId } = useParams();
    console.log("🔍 TaskId aus URL:", taskId);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const [formData, setFormData] = useState({
        taskId: '',
        leadName: '',
        // 1. Persönliche Daten
        vorname: '',
        nachname: '',
        familienstand: '',
        strasse: '',
        hausnummer: '',
        wohnort: '',
        plz: '',
        geburtsdatum: '',
        geburtsort: '',
        unterhaltspflicht: false,
        kinderAnzahl: '',
        unterhaltArt: '',
        
        // 2. Einkommensverhältnis
        beschaeftigungsArt: '',
        befristet: false,
        selbststaendig: false,
        nettoEinkommen: '',
        nebenbeschaeftigung: '',
        nebenbeschaeftigungBemerkung: '',
        zusatzEinkommen: '',
        zusatzEinkommenBemerkung: '',
        
        // 3. Berufserfahrung
        erlernterBeruf: '',
        derzeitigeTaetigkeit: '',
        rechtsform: '',
        
        // 4. Sonstige Angaben
        warSelbststaendig: false,
        warSelbststaendigBemerkung: '',
        sbGemeldetAbgemeldet: '',
        sbGemeldetAbgemeldetBemerkung: '',
        
        // 5. Vermögenssituation
        // Immobilien
        immobilien: false,
        immobilienDetails: '',
        immobilienBemerkung: '',
        immobilieAusland: false,
        
        // Fahrzeug
        fahrzeuge: false,
        fahrzeugWert: '',
        fahrzeugFinanziert: false,
        fahrzeugFinanzierungArt: '',
        fahrzeugKreditsumme: '',
        fahrzeugbriefBank: false,
        fahrzeugNotwendig: false,
        fahrzeugArbeitsweg: false,
        fahrzeugArbeitswegKm: '',
        
        // Vermögen an Angehörige
        vermoegenAngehoerige2Jahre: false,
        vermoegenAngehoerige2JahreBetrag: '',
        vermoegenAngehoerige4Jahre: false,
        vermoegenAngehoerige4JahreBetrag: '',
        
        // Schenkungen
        schenkungAngehoerige: false,
        schenkungAngehoerigeDetails: '',
        schenkungAndere: false,
        schenkungAndereDetails: '',
        
        // Vermögenswerte
        sparbuch: false,
        sparbuchWert: '',
        investDepotGeldanlagen: false,
        investDepotGeldanlagenWert: '',
        lebensversicherung: false,
        lebensversicherungWert: '',
        lebensversicherungRueckkaufwert: '',
        bausparvertrag: false,
        bausparvertragWert: '',
        bausparvertragRueckkaufwert: '',
        rentenversicherung: false,
        rentenversicherungWert: '',
        rentenversicherungRueckkaufwert: '',
        weitereVermoegen: false,
        weitereVermoegenDetails: '',
        weitereVermoegenBemerkung: '',
        
        // 6. Schuldensituation
        gesamtSchulden: '',
        gesamtSchuldenBemerkung: '',
        hausbank: '',
        dispo: '',
        dispoBemerkung: '',
        pKonto: false,
        pKontoBemerkung: '',
        kontoWechselEmpfohlen: false,
        kontoWechselEmpfohlenBemerkung: '',
        glaeubiger: '',
        forderungenOeffentlich: '',
        forderungenPrivat: '',
        schuldenartInfo: '',
        schuldenartInfoBemerkung: '',
        vorherigeInsolvenz: false,
        insolvenzDatum: '',
        vorherigeInsolvenzBemerkung: '',
        aktuelePfaendung: false,
        pfaendungDetails: '',
        
        // 7. Mandatsinformationen
        entschuldungsart: '',
        ratenzahlungMonate: '2',
        benutzerdefinierteMonate: '',
        bearbeitungStart: '1', // Standardwert: 1. des Monats
        abrechnungStart: '1',   // Standardwert: 1. des Monats
        notizen: ''
    });

    const [checklist, setChecklist] = useState({
        vorstellung: false,
        leadAbgleich: false,
        vollmachtGeprueft: false,
        zeitVerfuegbar: false,
        einleitung: false
    });

    const loadFormData = async (taskId) => {
        setIsLoading(true);
        try {
            console.group('LoadFormData Debug');
            console.log('TaskId:', taskId);
            console.log('Backend URL:', BACKEND_URL);

            const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`);
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Received data:', data);
            console.groupEnd();

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            if (!data.taskId) {
                console.warn('Warning: Received data has no taskId', data);
            }

            setFormData(prevState => ({
                ...prevState,
                ...data,
                taskId: data.taskId || taskId
            }));
            setOriginalData(data);

        } catch (error) {
            console.error('Error in loadFormData:', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            loadFormData(taskId);
        }
    }, [taskId]);

    const calculatePrice = () => {
        const nettoEinkommen = parseFloat(formData.nettoEinkommen) || 0;
        const kinderAnzahl = parseInt(formData.kinderAnzahl) || 0;
        const anzahlGlaeubiger = parseInt(formData.glaeubiger) || 0;

        // Basis-Preis Berechnung
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const basisPreis = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Pfändungspreis Berechnung
        const pfaendungsPreis = getPfaendungsbetrag(nettoEinkommen, kinderAnzahl);

        // Ermittle den höheren Preis
        const gesamtPreis = Math.max(basisPreis, pfaendungsPreis || 0);

        return {
            startgebuehr,
            glaeubigerKosten: anzahlGlaeubiger * preisProGlaeubiger,
            pfaendungsPreis: pfaendungsPreis || 0,
            gesamtPreis,
            berechnungsArt: pfaendungsPreis > basisPreis ? 'Pfändungsberechnung' : 'Standardberechnung'
        };
    };

    const calculateRates = () => {
        const gesamtPreis = calculatePrice().gesamtPreis;
        let monate;

        if (formData.ratenzahlungMonate === 'custom') {
            monate = parseInt(formData.benutzerdefinierteMonate) || 1;
            monate = Math.min(Math.max(monate, 1), 12);
        } else {
            monate = parseInt(formData.ratenzahlungMonate) || 2;
        }

        const monatsRate = gesamtPreis / monate;
        return {
            monatsRate,
            gesamtPreis,
            monate
        };
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleChecklistChange = (e) => {
        const { name, checked } = e.target;
        setChecklist(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const saveFormData = async (setQualified = false) => {
        setIsSaving(true);
        setSaveError(null);

        try {
            const updatedData = {
                ...formData,
                qualifiziert: setQualified ? true : formData.qualifiziert // Nur setzen wenn explizit angefordert
            };

            console.log("📤 Sende Daten an Backend:", updatedData);
            const response = await fetch(`${BACKEND_URL}/api/forms/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern');

            const data = await response.json();
            console.log('✅ Daten erfolgreich gespeichert:', data);

            // Update lokalen State
            setFormData(updatedData);
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            setSaveError('Fehler beim Speichern');
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return <ErrorDisplay error={error} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Privatinsolvenz Erstberatung - Formular</h1>

            {isLoading ? (
                <div className="text-center p-4">Lade Formulardaten...</div>
            ) : (
                <>

                    {/* 1. Gesprächseröffnung */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>1. Gesprächseröffnung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="vorstellung"
                                        checked={checklist.vorstellung}
                                        onChange={handleChecklistChange}
                                        className="h-4 w-4"
                                    />
                                    <span>Eigene Vorstellung durchgeführt</span>
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="leadAbgleich"
                                            checked={checklist.leadAbgleich}
                                            onChange={handleChecklistChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Lead-Daten abgeglichen</span>
                                    </label>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            name="leadName"
                                            value={formData.leadName}
                                            onChange={handleInputChange}
                                            placeholder="Name des Leads"
                                            className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Persönliche Daten */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>2. Persönliche Daten</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <style jsx global>{`
                                @keyframes fadeIn {
                                  from { opacity: 0; transform: translateY(-10px); }
                                  to { opacity: 1; transform: translateY(0); }
                                }
                                .animate-fadeIn {
                                  animation: fadeIn 0.3s ease-out forwards;
                                }
                            `}</style>
                            
                            {/* Persönliche Informationen - Name, Familienstand, Geburtsdatum und Geburtsort */}
                            <div className="mb-6">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    {/* Name */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2 font-medium">Vorname</label>
                                            <input
                                                type="text"
                                                name="vorname"
                                                value={formData.vorname}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-medium">Nachname</label>
                                            <input
                                                type="text"
                                                name="nachname"
                                                value={formData.nachname}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Familienstand und Geburtsdatum */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-2 font-medium">Familienstand</label>
                                            <select
                                                name="familienstand"
                                                value={formData.familienstand}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all">
                                                <option value="">Bitte wählen</option>
                                                <option value="ledig">Ledig</option>
                                                <option value="verheiratet">Verheiratet</option>
                                                <option value="geschieden">Geschieden</option>
                                                <option value="getrennt lebend">Getrennt lebend</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-medium">Geburtsdatum</label>
                                            <input
                                                type="date"
                                                name="geburtsdatum"
                                                value={formData.geburtsdatum}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Geburtsort */}
                                    <div>
                                        <label className="block mb-2 font-medium">Geburtsort</label>
                                        <input
                                            type="text"
                                            name="geburtsort"
                                            value={formData.geburtsort}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Kinder */}
                            <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-sm">
                                <div className="flex items-center mb-3">
                                    <input
                                        type="checkbox"
                                        name="unterhaltspflicht"
                                        checked={formData.unterhaltspflicht || false}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-blue-600"
                                    />
                                    <span className="ml-2 font-medium text-blue-800">Unterhaltspflichtige Kinder</span>
                                </div>
                                
                                {formData.unterhaltspflicht && (
                                    <div className="sm:pl-7 space-y-4 mt-3 animate-fadeIn">
                                        <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                                            <label className="block mb-2 font-medium text-gray-700">Anzahl unterhaltspflichtiger Kinder</label>
                                            <input
                                                type="number"
                                                name="kinderAnzahl"
                                                value={formData.kinderAnzahl}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-2 border-blue-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" />
                                            
                                            <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded italic">
                                                Unterhaltspflichtige Kinder sind minderjährige Kinder oder Kinder in Schule/Ausbildung
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                                            <label className="block mb-3 font-medium text-gray-700">Wird Unterhalt gewährt?</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <label className={`flex items-center sm:flex-col p-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-200 
                                                    ${formData.unterhaltArt === 'barunterhalt' ? 'bg-blue-100 border-blue-400' : ''}`}>
                                                    <div className="flex justify-center items-center sm:mb-2 h-6 mr-2 sm:mr-0">
                                                        <input
                                                            type="radio"
                                                            name="unterhaltArt"
                                                            value="barunterhalt"
                                                            checked={formData.unterhaltArt === 'barunterhalt'}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <span className="sm:text-center">Barunterhalt</span>
                                                </label>
                                                
                                                <label className={`flex items-center sm:flex-col p-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-200
                                                    ${formData.unterhaltArt === 'naturalunterhalt' ? 'bg-blue-100 border-blue-400' : ''}`}>
                                                    <div className="flex justify-center items-center sm:mb-2 h-6 mr-2 sm:mr-0">
                                                        <input
                                                            type="radio"
                                                            name="unterhaltArt"
                                                            value="naturalunterhalt"
                                                            checked={formData.unterhaltArt === 'naturalunterhalt'}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <span className="sm:text-center">Naturalunterhalt</span>
                                                </label>
                                                
                                                <label className={`flex items-center sm:flex-col p-2 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors duration-200
                                                    ${formData.unterhaltArt === 'kein' ? 'bg-blue-100 border-blue-400' : ''}`}>
                                                    <div className="flex justify-center items-center sm:mb-2 h-6 mr-2 sm:mr-0">
                                                        <input
                                                            type="radio"
                                                            name="unterhaltArt"
                                                            value="kein"
                                                            checked={formData.unterhaltArt === 'kein'}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <span className="sm:text-center">Kein Unterhalt</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Adresse */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <h3 className="font-medium text-gray-700 mb-4">Adresse</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                                    <div className="sm:col-span-3">
                                        <label className="block mb-2">Straße</label>
                                        <input
                                            type="text"
                                            name="strasse"
                                            value={formData.strasse}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" />
                                    </div>
                                    <div>
                                        <label className="block mb-2">Hausnummer</label>
                                        <input
                                            type="text"
                                            name="hausnummer"
                                            value={formData.hausnummer}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div className="sm:col-span-3">
                                        <label className="block mb-2">Wohnort</label>
                                        <input
                                            type="text"
                                            name="wohnort"
                                            value={formData.wohnort}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" />
                                    </div>
                                    <div>
                                        <label className="block mb-2">PLZ</label>
                                        <input
                                            type="text"
                                            name="plz"
                                            value={formData.plz}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Einkommensverhältnis */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>2. Einkommensverhältnis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Arbeitgeber / Status</label>
                                        <select
                                            name="beschaeftigungsArt"
                                            value={formData.beschaeftigungsArt}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        >
                                            <option value="">Bitte wählen</option>
                                            <option value="in Arbeit">in Arbeit</option>
                                            <option value="Rentner">Rentner</option>
                                            <option value="Arbeitslos">Arbeitslos</option>
                                            <option value="Bürgergeld">Bürgergeld</option>
                                            <option value="Selbstständig">Selbstständig</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Netto-Einkommen</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="nettoEinkommen"
                                                value={formData.nettoEinkommen}
                                                onChange={handleInputChange}
                                                placeholder="0,00"
                                                className="w-full p-3 pl-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-gray-500">€</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nebenbeschäftigung mit Bermerkungsfeld */}
                                <div className="mb-4">
                                    <label className="block mb-2 font-medium text-gray-700">Nebenbeschäftigung</label>
                                    <input
                                        type="text"
                                        name="nebenbeschaeftigung"
                                        value={formData.nebenbeschaeftigung}
                                        onChange={handleInputChange}
                                        placeholder="Nebenbeschäftigung"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all mb-2"
                                    />
                                    <textarea
                                        name="nebenbeschaeftigungBemerkung"
                                        value={formData.nebenbeschaeftigungBemerkung}
                                        onChange={handleInputChange}
                                        placeholder="Bemerkungen zur Nebenbeschäftigung"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        rows="2"
                                    ></textarea>
                                </div>

                                {/* Sonstige regelmäßige Einkünfte mit Bermerkungsfeld */}
                                <div className="mb-4">
                                    <label className="block mb-2 font-medium text-gray-700">Sonstige regelmäßige Einkünfte</label>
                                    <div className="relative mb-2">
                                        <input
                                            type="number"
                                            name="zusatzEinkommen"
                                            value={formData.zusatzEinkommen}
                                            onChange={handleInputChange}
                                            placeholder="0,00"
                                            className="w-full p-3 pl-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-gray-500">€</span>
                                        </div>
                                    </div>
                                    <textarea
                                        name="zusatzEinkommenBemerkung"
                                        value={formData.zusatzEinkommenBemerkung}
                                        onChange={handleInputChange}
                                        placeholder="Bemerkungen zu sonstigen Einkünften"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        rows="2"
                                    ></textarea>
                                </div>

                                {formData.beschaeftigungsArt === 'Selbstständig' && (
                                    <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-200 animate-fadeIn">
                                        <div className="flex items-start">
                                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                            <div className="ml-3">
                                                <h4 className="text-sm font-medium text-red-800">Wichtiger Hinweis</h4>
                                                <p className="mt-1 text-sm text-red-700">
                                                    Bei Selbstständigkeit muss die Rechtsform genau geprüft werden!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Berufserfahrung */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>3. Berufserfahrung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Erlernter Beruf</label>
                                        <input
                                            type="text"
                                            name="erlernterBeruf"
                                            value={formData.erlernterBeruf}
                                            onChange={handleInputChange}
                                            placeholder="Erlernter Beruf"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-2 font-medium text-gray-700">Ausgeübter Beruf</label>
                                        <input
                                            type="text"
                                            name="derzeitigeTaetigkeit"
                                            value={formData.derzeitigeTaetigkeit}
                                            onChange={handleInputChange}
                                            placeholder="Ausgeübter Beruf"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Sonstige Angaben */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>4. Sonstige Angaben</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-4">
                                    <div className="flex items-center space-x-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            name="warSelbststaendig"
                                            checked={formData.warSelbststaendig || false}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-blue-600"
                                        />
                                        <span className="font-medium">Früher Selbstständig</span>
                                    </div>
                                    {formData.warSelbststaendig && (
                                        <textarea
                                            name="warSelbststaendigBemerkung"
                                            value={formData.warSelbststaendigBemerkung}
                                            onChange={handleInputChange}
                                            placeholder="Details zur früheren Selbstständigkeit"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            rows="2"
                                        ></textarea>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 font-medium text-gray-700">SB gemeldet/abgemeldet</label>
                                    <input
                                        type="text"
                                        name="sbGemeldetAbgemeldet"
                                        value={formData.sbGemeldetAbgemeldet}
                                        onChange={handleInputChange}
                                        placeholder="SB gemeldet/abgemeldet"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all mb-2"
                                    />
                                    <textarea
                                        name="sbGemeldetAbgemeldetBemerkung"
                                        value={formData.sbGemeldetAbgemeldetBemerkung}
                                        onChange={handleInputChange}
                                        placeholder="Bemerkungen zur SB Meldung/Abmeldung"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Vermögenssituation */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>5. Vermögenssituation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Immobilien */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="immobilien"
                                            checked={formData.immobilien}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Immobilienbesitz / Wohneigentum</span>
                                    </label>
                                    {formData.immobilien && (
                                        <div className="pl-6 space-y-3 mt-2">
                                            <input
                                                type="text"
                                                name="immobilienDetails"
                                                value={formData.immobilienDetails}
                                                onChange={handleInputChange}
                                                placeholder="Details zum Immobilienbesitz"
                                                className="w-full p-2 border rounded"
                                            />
                                            
                                            <textarea
                                                name="immobilienBemerkung"
                                                value={formData.immobilienBemerkung}
                                                onChange={handleInputChange}
                                                placeholder="Bemerkungen zum Immobilienbesitz"
                                                className="w-full p-2 border rounded"
                                                rows="2"
                                            ></textarea>
                                            
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="immobilieAusland"
                                                    checked={formData.immobilieAusland || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Immobilie im Ausland</span>
                                            </label>
                                            
                                            {formData.immobilieAusland && (
                                                <Alert className="mt-1" variant="destructive">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        ACHTUNG: Bei Immobilien im Ausland können wir nicht weiterhelfen.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Fahrzeug */}
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="fahrzeuge"
                                            checked={formData.fahrzeuge}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>Auto/Fahrzeug vorhanden</span>
                                    </label>
                                    {formData.fahrzeuge && (
                                        <div className="pl-6 space-y-3 mt-2">
                                            <input
                                                type="text"
                                                name="fahrzeugWert"
                                                value={formData.fahrzeugWert || ''}
                                                onChange={handleInputChange}
                                                placeholder="Fahrzeugwert"
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                            />
                                            
                                            <div>
                                                <label className="block mb-2 font-medium">Fahrzeugfinanzierung/Haltung</label>
                                                <select
                                                    name="fahrzeugFinanzierungArt"
                                                    value={formData.fahrzeugFinanzierungArt}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                >
                                                    <option value="">Bitte wählen</option>
                                                    <option value="Miete">Miete</option>
                                                    <option value="Leasing">Leasing</option>
                                                    <option value="Finanzierung">Finanzierung</option>
                                                    <option value="Firmenwagen">Firmenwagen</option>
                                                </select>
                                            </div>
                                            
                                            {(formData.fahrzeugFinanzierungArt === 'Finanzierung' || formData.fahrzeugFinanzierungArt === 'Leasing') && (
                                                <div>
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            name="fahrzeugFinanziert"
                                                            checked={formData.fahrzeugFinanziert || false}
                                                            onChange={handleInputChange}
                                                            className="h-4 w-4"
                                                        />
                                                        <span>Finanziert</span>
                                                    </label>
                                                    {formData.fahrzeugFinanziert && (
                                                        <input
                                                            type="text"
                                                            name="fahrzeugKreditsumme"
                                                            value={formData.fahrzeugKreditsumme || ''}
                                                            onChange={handleInputChange}
                                                            placeholder="Offene Kreditsumme"
                                                            className="w-full mt-2 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            
                                            {formData.fahrzeugFinanziert && (
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        name="fahrzeugbriefBank"
                                                        checked={formData.fahrzeugbriefBank || false}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4"
                                                    />
                                                    <span>Fahrzeugbrief bei der Bank</span>
                                                </label>
                                            )}
                                            
                                            <div>
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        name="fahrzeugArbeitsweg"
                                                        checked={formData.fahrzeugArbeitsweg || false}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4"
                                                    />
                                                    <span>Fahrzeug Nutzung für Arbeit</span>
                                                </label>
                                                {formData.fahrzeugArbeitsweg && (
                                                    <input
                                                        type="text"
                                                        name="fahrzeugArbeitswegKm"
                                                        value={formData.fahrzeugArbeitswegKm || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Anzahl KM"
                                                        className="w-full mt-2 ml-6 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                                    />
                                                )}
                                            </div>
                                            
                                            {formData.fahrzeugArbeitsweg && (
                                                <Alert className="mt-1">
                                                    <AlertDescription>
                                                        Hinweis: Auto ist nicht pfändbar, wenn der Weg mit öffentlichen Verkehrsmitteln länger als 60 Minuten dauern würde.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Vermögen an Angehörige */}
                                <div className="pt-4">
                                    <h3 className="font-medium mb-3">Vermögen an Angehörige</h3>
                                    <div className="space-y-4 pl-2">
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="vermoegenAngehoerige2Jahre"
                                                    checked={formData.vermoegenAngehoerige2Jahre || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Vermögen an Angehörige in 2 Jahren gezahlt</span>
                                            </label>
                                            {formData.vermoegenAngehoerige2Jahre && (
                                                <input
                                                    type="text"
                                                    name="vermoegenAngehoerige2JahreBetrag"
                                                    value={formData.vermoegenAngehoerige2JahreBetrag || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Betrag in Euro"
                                                    className="w-full mt-2 ml-6 p-2 border rounded"
                                                />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="vermoegenAngehoerige4Jahre"
                                                    checked={formData.vermoegenAngehoerige4Jahre || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Vermögen an Angehörige i.d.l. 4 Jahren gezahlt</span>
                                            </label>
                                            {formData.vermoegenAngehoerige4Jahre && (
                                                <input
                                                    type="text"
                                                    name="vermoegenAngehoerige4JahreBetrag"
                                                    value={formData.vermoegenAngehoerige4JahreBetrag || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Betrag in Euro"
                                                    className="w-full mt-2 ml-6 p-2 border rounded"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Schenkungen (alte Implementierung) */}
                                <div className="hidden">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="schenkungAngehoerige"
                                            checked={formData.schenkungAngehoerige || false}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>In den letzten 2 Jahren etwas an Angehörige verschenkt</span>
                                    </label>
                                    {formData.schenkungAngehoerige && (
                                        <div className="pl-6 mt-2">
                                            <input
                                                type="text"
                                                name="schenkungAngehoerigeDetails"
                                                value={formData.schenkungAngehoerigeDetails || ''}
                                                onChange={handleInputChange}
                                                placeholder="Details zur Schenkung*"
                                                required
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                            />
                                            <Alert className="mt-2" variant="destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    ACHTUNG: Diese Information muss unbedingt dem Anwalt mitgeteilt werden!
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                </div>

                                <div className="hidden">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="schenkungAndere"
                                            checked={formData.schenkungAndere || false}
                                            onChange={handleInputChange}
                                            className="h-4 w-4"
                                        />
                                        <span>In den letzten 4 Jahren etwas an andere Personen verschenkt</span>
                                    </label>
                                    {formData.schenkungAndere && (
                                        <div className="pl-6 mt-2">
                                            <input
                                                type="text"
                                                name="schenkungAndereDetails"
                                                value={formData.schenkungAndereDetails || ''}
                                                onChange={handleInputChange}
                                                placeholder="Details zur Schenkung*"
                                                required
                                                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                                            />
                                            <Alert className="mt-2" variant="default">
                                                <AlertDescription className="text-blue-700">
                                                    Hinweis: Der Insolvenzverwalter kann diese Schenkung möglicherweise zurückfordern.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                </div>

                                {/* Vermögenswerte */}
                                <div className="pt-4">
                                    <h3 className="font-medium mb-3">Vermögenswerte</h3>
                                    <div className="space-y-4 pl-2">
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="sparbuch"
                                                    checked={formData.sparbuch || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Sparbuch/Bargeld</span>
                                            </label>
                                            {formData.sparbuch && (
                                                <input
                                                    type="text"
                                                    name="sparbuchWert"
                                                    value={formData.sparbuchWert || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Wert/Details"
                                                    className="w-full mt-2 ml-6 p-2 border rounded"
                                                />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="investDepotGeldanlagen"
                                                    checked={formData.investDepotGeldanlagen || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Invest/Depot/Bitcoin/Geldanlagen</span>
                                            </label>
                                            {formData.investDepotGeldanlagen && (
                                                <input
                                                    type="text"
                                                    name="investDepotGeldanlagenWert"
                                                    value={formData.investDepotGeldanlagenWert || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Wert/Details"
                                                    className="w-full mt-2 ml-6 p-2 border rounded"
                                                />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="lebensversicherung"
                                                    checked={formData.lebensversicherung || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Lebensversicherung</span>
                                            </label>
                                            {formData.lebensversicherung && (
                                                <div className="space-y-2 mt-2 ml-6">
                                                    <input
                                                        type="text"
                                                        name="lebensversicherungWert"
                                                        value={formData.lebensversicherungWert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Wert/Details"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="lebensversicherungRueckkaufwert"
                                                        value={formData.lebensversicherungRueckkaufwert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Rückkaufwert/aktueller Wert"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="bausparvertrag"
                                                    checked={formData.bausparvertrag || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Bausparvertrag</span>
                                            </label>
                                            {formData.bausparvertrag && (
                                                <div className="space-y-2 mt-2 ml-6">
                                                    <input
                                                        type="text"
                                                        name="bausparvertragWert"
                                                        value={formData.bausparvertragWert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Wert/Details"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="bausparvertragRueckkaufwert"
                                                        value={formData.bausparvertragRueckkaufwert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Rückkaufwert/aktueller Wert"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="rentenversicherung"
                                                    checked={formData.rentenversicherung || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Rentenzusatzversicherung</span>
                                            </label>
                                            {formData.rentenversicherung && (
                                                <div className="space-y-2 mt-2 ml-6">
                                                    <input
                                                        type="text"
                                                        name="rentenversicherungWert"
                                                        value={formData.rentenversicherungWert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Wert/Details"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                    <input
                                                        type="text"
                                                        name="rentenversicherungRueckkaufwert"
                                                        value={formData.rentenversicherungRueckkaufwert || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Rückkaufwert/aktueller Wert"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    name="weitereVermoegen"
                                                    checked={formData.weitereVermoegen || false}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4"
                                                />
                                                <span>Weitere Vermögenswerte</span>
                                            </label>
                                            {formData.weitereVermoegen && (
                                                <div className="space-y-2 mt-2 ml-6">
                                                    <input
                                                        type="text"
                                                        name="weitereVermoegenDetails"
                                                        value={formData.weitereVermoegenDetails || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Details zu weiteren Vermögenswerten"
                                                        className="w-full p-2 border rounded"
                                                    />
                                                    <textarea
                                                        name="weitereVermoegenBemerkung"
                                                        value={formData.weitereVermoegenBemerkung || ''}
                                                        onChange={handleInputChange}
                                                        placeholder="Bemerkungen zu weiteren Vermögenswerten"
                                                        className="w-full p-2 border rounded"
                                                        rows="2"
                                                    ></textarea>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Schuldensituation */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>6. Schuldensituation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700">Gesamtschuldenhöhe</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="gesamtSchulden"
                                                    value={formData.gesamtSchulden}
                                                    onChange={handleInputChange}
                                                    placeholder="0,00"
                                                    className="w-full p-3 pl-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-gray-500">€</span>
                                                </div>
                                            </div>
                                            <textarea
                                                name="gesamtSchuldenBemerkung"
                                                value={formData.gesamtSchuldenBemerkung || ''}
                                                onChange={handleInputChange}
                                                placeholder="Bemerkungen zur Gesamtschuldenhöhe"
                                                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700">Anzahl Gläubiger</label>
                                            <input
                                                type="number"
                                                name="glaeubiger"
                                                value={formData.glaeubiger}
                                                onChange={handleInputChange}
                                                placeholder="0"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                            />
                                        </div>
                                    </div>

                                    {/* Hausbank und Dispo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700">Hausbank</label>
                                            <input
                                                type="text"
                                                name="hausbank"
                                                value={formData.hausbank}
                                                onChange={handleInputChange}
                                                placeholder="Name der Hausbank"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700">Dispo</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="dispo"
                                                    value={formData.dispo}
                                                    onChange={handleInputChange}
                                                    placeholder="0,00"
                                                    className="w-full p-3 pl-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all" 
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-gray-500">€</span>
                                                </div>
                                            </div>
                                            <textarea
                                                name="dispoBemerkung"
                                                value={formData.dispoBemerkung || ''}
                                                onChange={handleInputChange}
                                                placeholder="Bemerkungen zum Dispo"
                                                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* P-Konto und Kontowechsel */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                                        <div>
                                            <div className="flex items-center space-x-2 cursor-pointer mb-2">
                                                <input
                                                    type="checkbox"
                                                    name="pKonto"
                                                    checked={formData.pKonto || false}
                                                    onChange={handleInputChange}
                                                    className="h-5 w-5 text-blue-600"
                                                />
                                                <span className="font-medium">P-Konto vorhanden</span>
                                            </div>
                                            {formData.pKonto && (
                                                <textarea
                                                    name="pKontoBemerkung"
                                                    value={formData.pKontoBemerkung || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Bemerkungen zum P-Konto"
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                                    rows="2"
                                                ></textarea>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2 cursor-pointer mb-2">
                                                <input
                                                    type="checkbox"
                                                    name="kontoWechselEmpfohlen"
                                                    checked={formData.kontoWechselEmpfohlen || false}
                                                    onChange={handleInputChange}
                                                    className="h-5 w-5 text-blue-600"
                                                />
                                                <span className="font-medium">Kontowechsel empfohlen</span>
                                            </div>
                                            {formData.kontoWechselEmpfohlen && (
                                                <textarea
                                                    name="kontoWechselEmpfohlenBemerkung"
                                                    value={formData.kontoWechselEmpfohlenBemerkung || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Begründung für Kontowechsel"
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                                    rows="2"
                                                ></textarea>
                                            )}
                                        </div>
                                    </div>

                                    {/* Schuldenart */}
                                    <div className="mb-5">
                                        <label className="block mb-2 font-medium text-gray-700">Kurzinfo zu GLB/ Schuldenart</label>
                                        <select
                                            name="schuldenartInfo"
                                            value={formData.schuldenartInfo}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all mb-2"
                                        >
                                            <option value="">Bitte wählen</option>
                                            <option value="Privatrechtliche">Privatrechtliche</option>
                                            <option value="öffentlich rechtlich">öffentlich rechtlich</option>
                                        </select>
                                        <textarea
                                            name="schuldenartInfoBemerkung"
                                            value={formData.schuldenartInfoBemerkung || ''}
                                            onChange={handleInputChange}
                                            placeholder="Bemerkungen zur Schuldenart"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            rows="2"
                                        ></textarea>
                                    </div>
                                </div>
                                
                                {/* Vorherige Insolvenz */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="vorherigeInsolvenz"
                                            checked={formData.vorherigeInsolvenz}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-blue-600 rounded"
                                        />
                                        <span className="font-medium">Vorherige Insolvenz</span>
                                    </label>
                                    
                                    {formData.vorherigeInsolvenz && (
                                        <div className="space-y-3 mt-3">
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 animate-fadeIn">
                                                <div className="flex items-start">
                                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                                    <div className="ml-3">
                                                        <h4 className="text-sm font-medium text-red-800">Kritischer Hinweis</h4>
                                                        <p className="mt-1 text-sm text-red-700">
                                                            ACHTUNG: Die 10-Jahres-Sperrfrist muss unbedingt beachtet werden!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <textarea
                                                name="vorherigeInsolvenzBemerkung"
                                                value={formData.vorherigeInsolvenzBemerkung || ''}
                                                onChange={handleInputChange}
                                                placeholder="Details zur vorherigen Insolvenz"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                                rows="2"
                                            ></textarea>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Ausschlusskriterien */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>6. Ausschlusskriterien prüfen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <h3 className="font-medium text-amber-800 mb-3">Automatische Prüfung relevanter Kriterien</h3>
                                
                                <div className="space-y-3">
                                    {formData.glaeubiger > 25 ? (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start">
                                            <div className="bg-red-100 rounded-full p-1 mr-3">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-red-800">Gläubigeranzahl überschreitet Maximum</h4>
                                                <p className="text-sm text-red-700 mt-1">
                                                    Die Anzahl der Gläubiger ({formData.glaeubiger}) übersteigt das Maximum von 25.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-start opacity-50">
                                            <div className="bg-green-100 rounded-full p-1 mr-3">
                                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-green-800">Gläubigeranzahl im erlaubten Bereich</h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Die Anzahl der Gläubiger ist unter dem Maximum von 25.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.vorherigeInsolvenz ? (
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start">
                                            <div className="bg-red-100 rounded-full p-1 mr-3">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-red-800">Vorherige Insolvenz festgestellt</h4>
                                                <p className="text-sm text-red-700 mt-1">
                                                    Die 10-Jahres-Sperrfrist muss unbedingt geprüft werden.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-start opacity-50">
                                            <div className="bg-green-100 rounded-full p-1 mr-3">
                                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-green-800">Keine vorherige Insolvenz</h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Es wurde keine vorherige Insolvenz angegeben.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.immobilien ? (
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start">
                                            <div className="bg-amber-100 rounded-full p-1 mr-3">
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-amber-800">Immobilienbesitz angegeben</h4>
                                                <p className="text-sm text-amber-700 mt-1">
                                                    Die Immobiliensituation muss detailliert geklärt werden.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-start opacity-50">
                                            <div className="bg-green-100 rounded-full p-1 mr-3">
                                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-green-800">Kein Immobilienbesitz</h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Es wurde kein Immobilienbesitz angegeben.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7. Mandatsinformationen */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>7. Mandatsinformationen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Art der Entschuldung */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-3">Art der Entschuldung</h3>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                    ${formData.entschuldungsart === 'InsO' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        entschuldungsart: 'InsO'
                                                    }))}
                                                >
                                                    {formData.entschuldungsart === 'InsO' && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>InsO</span>
                                        </label>

                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                    ${formData.entschuldungsart === 'Vergleich' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        entschuldungsart: 'Vergleich'
                                                    }))}
                                                >
                                                    {formData.entschuldungsart === 'Vergleich' && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>Vergleich</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Start der Entschuldung */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-3">Start der Entschuldung</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-2">Tag</label>
                                            <div className="flex items-center gap-8">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                            ${formData.bearbeitungStart === '1' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                bearbeitungStart: '1'
                                                            }))}
                                                        >
                                                            {formData.bearbeitungStart === '1' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 01.</span>
                                                </label>

                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <div className="p-3">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                            ${formData.bearbeitungStart === '15' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                bearbeitungStart: '15'
                                                            }))}
                                                        >
                                                            {formData.bearbeitungStart === '15' && (
                                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span>zum 15.</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2">Monat</label>
                                            <select
                                                name="bearbeitungMonat"
                                                value={formData.bearbeitungMonat || ''}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                            >
                                                <option value="">Aktueller Monat</option>
                                                <option value="1">Januar</option>
                                                <option value="2">Februar</option>
                                                <option value="3">März</option>
                                                <option value="4">April</option>
                                                <option value="5">Mai</option>
                                                <option value="6">Juni</option>
                                                <option value="7">Juli</option>
                                                <option value="8">August</option>
                                                <option value="9">September</option>
                                                <option value="10">Oktober</option>
                                                <option value="11">November</option>
                                                <option value="12">Dezember</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Preisberechnungsmodus Auswahl */}
                                <div className="mb-4">
                                    <h3 className="font-medium mb-3">Berechnungsmodus</h3>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                    ${!formData.manuellerPreis ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        manuellerPreis: false
                                                    }))}
                                                >
                                                    {!formData.manuellerPreis && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>Automatische Berechnung</span>
                                        </label>

                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <div className="p-2">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                    ${formData.manuellerPreis ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        manuellerPreis: true
                                                    }))}
                                                >
                                                    {formData.manuellerPreis && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            <span>Manueller Preis</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preisübersicht - nur zeigen, wenn nicht manueller Modus */}
                                {!formData.manuellerPreis ? (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium mb-3">Kostenaufstellung</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Standardberechnung */}
                                            <div className="col-span-2 mt-2 mb-2 pt-2 border-t border-gray-200">
                                                <div className="font-semibold">Standardberechnung:</div>
                                            </div>
                                            <div>Startgebühr Insolvenz:</div>
                                            <div className="text-right">{calculatePrice().startgebuehr.toFixed(2)} €</div>
                                            <div>Kosten für {formData.glaeubiger || 0} Gläubiger:</div>
                                            <div className="text-right">{calculatePrice().glaeubigerKosten.toFixed(2)} €</div>
                                            <div className="font-medium">Standardpreis:</div>
                                            <div className="text-right font-medium">{(calculatePrice().startgebuehr + calculatePrice().glaeubigerKosten).toFixed(2)} €</div>

                                            {/* Pfändungsberechnung */}
                                            <div className="col-span-2 mt-4 mb-2 pt-2 border-t border-gray-200">
                                                <div className="font-semibold">Pfändungsberechnung:</div>
                                            </div>
                                            <div>Monatlich pfändbar:</div>
                                            <div className="text-right">{(calculatePrice().pfaendungsPreis / 3).toFixed(2)} €</div>
                                            <div>Pfändbar für 3 Monate:</div>
                                            <div className="text-right">{calculatePrice().pfaendungsPreis.toFixed(2)} €</div>

                                            {/* Gesamtpreis */}
                                            <div className="col-span-2 mt-4 pt-2 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-bold">Gesamtpreis (der höhere Betrag):</div>
                                                    <div className="text-right font-bold text-lg">{calculatePrice().gesamtPreis.toFixed(2)} €</div>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-2">
                                                    Berechnung basierend auf: {calculatePrice().berechnungsArt}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-medium mb-3">Manueller Preis</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block mb-2">Gesamtpreis (€)</label>
                                                <input
                                                    type="number"
                                                    name="manuellerPreisBetrag"
                                                    value={formData.manuellerPreisBetrag || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Betrag eingeben"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-2">Begründung / Notiz</label>
                                                <textarea
                                                    name="manuellerPreisNotiz"
                                                    value={formData.manuellerPreisNotiz || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Grund für manuellen Preis eingeben"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400 min-h-[80px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ratenzahlungsrechner - funktioniert mit beiden Preisberechnungsmethoden */}
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="font-medium mb-3">Ratenvereinbarung</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2">Anzahl der Raten</label>
                                            <select
                                                name="ratenzahlungMonate"
                                                value={formData.ratenzahlungMonate}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                            >
                                                <option value="1">1 Rate</option>
                                                <option value="2">2 Raten</option>
                                                <option value="3">3 Raten</option>
                                                <option value="4">4 Raten</option>
                                                <option value="5">5 Raten</option>
                                                <option value="6">6 Raten</option>
                                                <option value="custom">Benutzerdefiniert</option>
                                            </select>
                                        </div>

                                        {formData.ratenzahlungMonate === 'custom' && (
                                            <div>
                                                <label className="block mb-2">Anzahl der Raten (1-12)</label>
                                                <input
                                                    type="number"
                                                    name="benutzerdefinierteMonate"
                                                    value={formData.benutzerdefinierteMonate || ''}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="12"
                                                    className="w-full p-2 border-[1px] rounded focus:outline-none focus:border-gray-400"
                                                    placeholder="Anzahl der Monate eingeben"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded mt-4">
                                            <div>Monatliche Rate:</div>
                                            <div className="text-right font-bold">
                                                {formData.manuellerPreis
                                                    ? ((parseFloat(formData.manuellerPreisBetrag) || 0) / (calculateRates().monate)).toFixed(2)
                                                    : calculateRates().monatsRate.toFixed(2)} €
                                            </div>

                                            <div>Laufzeit:</div>
                                            <div className="text-right">{calculateRates().monate} Monate</div>

                                            <div>Gesamtbetrag:</div>
                                            <div className="text-right">
                                                {formData.manuellerPreis
                                                    ? (parseFloat(formData.manuellerPreisBetrag) || 0).toFixed(2)
                                                    : calculateRates().gesamtPreis.toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Alert>
                                    <AlertDescription>
                                        Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                                        {!formData.manuellerPreis
                                            ? ' Die Berechnung basiert auf einer Startgebühr von 799€ plus 39€ pro Gläubiger.'
                                            : ' Ein manueller Preis wurde festgelegt.'}
                                        Die Ratenzahlung ist zinslos.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zustellungsart des Angebots */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>8. Zustellungsart des Angebots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex space-x-8 justify-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className="p-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                            ${formData.zustellungPost ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                zustellungPost: !prev.zustellungPost
                                            }))}
                                        >
                                            {formData.zustellungPost && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span>Per Post</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <div className="p-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                            ${formData.zustellungEmail ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                zustellungEmail: !prev.zustellungEmail
                                            }))}
                                        >
                                            {formData.zustellungEmail && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span>Per E-Mail</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Freies Notizfeld */}
                    <Card className="mb-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle>9. Notizen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <textarea 
                                    name="notizen"
                                    value={formData.notizen || ''}
                                    onChange={handleInputChange}
                                    placeholder="Freie Notizen zur Beratung"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                    rows="5"
                                ></textarea>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Qualifiziert & Speichern Buttons */}
                    <div className="flex justify-center space-x-4 mt-6 mb-8">
                        <button
                            className={`px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors ${isSaving ? 'opacity-50' : ''}`}
                            onClick={() => saveFormData(false)}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                        </button>
                        
                        <button
                            className={`px-6 py-3 ${formData.qualifiziert
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'} 
                                text-white font-semibold rounded-lg transition-colors ${isSaving ? 'opacity-50' : ''}`}
                            onClick={() => saveFormData(true)}
                            disabled={isSaving || formData.qualifiziert}
                        >
                            {isSaving ? 'Wird gespeichert...' : formData.qualifiziert ? 'Bereits qualifiziert' : 'Qualifiziert'}
                        </button>
                    </div>

                    {saveError && (
                        <div className="text-red-500 text-center mt-2">
                            {saveError}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PrivatinsolvenzFormular;