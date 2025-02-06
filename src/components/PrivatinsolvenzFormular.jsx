import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const PrivatinsolvenzFormular = () => {
    const [formData, setFormData] = useState({
        // Persönliche Daten
        familienstand: '',
        wohnort: '',
        plz: '',
        kinderAnzahl: '',
        kinderAlter: '',
        unterhaltspflicht: '',
        unterhaltHoehe: '',

        // Berufliche Situation
        beschaeftigungsArt: '',
        befristet: false,
        selbststaendig: false,
        rechtsform: '',
        nettoEinkommen: '',
        zusatzEinkommen: '',

        // Vermögenswerte
        immobilien: false,
        immobilienDetails: '',
        bankguthaben: '',
        fahrzeuge: false,
        fahrzeugWert: '',
        lebensversicherung: false,
        versicherungWert: '',
        sonstigeVermoegen: '',

        // Schuldensituation
        gesamtSchulden: '',
        glaeubiger: '',
        forderungenOeffentlich: '',
        forderungenPrivat: '',
        vorherigeInsolvenz: false,
        insolvenzDatum: '',
        aktuelePfaendung: false,
        pfaendungDetails: '',

        // Ratenzahlung
        ratenzahlungMonate: '2',
        benutzerdefinierteMonate: ''
    });

    const [checklist, setChecklist] = useState({
        vorstellung: false,
        leadAbgleich: false,
        vollmachtGeprueft: false,
        zeitVerfuegbar: false,
        einleitung: false
    });

    // Preisberechnung
    const calculatePrice = () => {
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const anzahlGlaeubiger = parseInt(formData.glaeubiger) || 0;

        const gesamtPreis = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);
        return {
            startgebuehr,
            glaeubigerKosten: anzahlGlaeubiger * preisProGlaeubiger,
            gesamtPreis
        };
    };

    // Ratenzahlungsberechnung
    const calculateRates = () => {
        const gesamtPreis = calculatePrice().gesamtPreis;
        let monate;

        if (formData.ratenzahlungMonate === 'custom') {
            monate = parseInt(formData.benutzerdefinierteMonate) || 1;
            // Begrenze benutzerdefinierte Monate auf 1-12
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

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Privatinsolvenz Erstberatung - Formular</h1>

            {/* 1. Gesprächseröffnung */}
            <Card className="mb-6">
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
                    </div>
                </CardContent>
            </Card>

            {/* 2. Persönliche Daten */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>2. Persönliche Daten</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2">Familienstand</label>
                            <input
                                type="text"
                                name="familienstand"
                                value={formData.familienstand}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Wohnort</label>
                            <input
                                type="text"
                                name="wohnort"
                                value={formData.wohnort}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">PLZ</label>
                            <input
                                type="text"
                                name="plz"
                                value={formData.plz}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Anzahl Kinder</label>
                            <input
                                type="number"
                                name="kinderAnzahl"
                                value={formData.kinderAnzahl}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Alter der Kinder</label>
                            <input
                                type="text"
                                name="kinderAlter"
                                value={formData.kinderAlter}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                placeholder="z.B.: 4, 7, 12"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Berufliche Situation */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>3. Berufliche Situation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2">Art der Beschäftigung</label>
                            <select
                                name="beschaeftigungsArt"
                                value={formData.beschaeftigungsArt}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Bitte wählen</option>
                                <option value="angestellt">Angestellt</option>
                                <option value="selbststaendig">Selbstständig</option>
                                <option value="arbeitslos">Arbeitslos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2">Netto-Einkommen</label>
                            <input
                                type="number"
                                name="nettoEinkommen"
                                value={formData.nettoEinkommen}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    {formData.beschaeftigungsArt === 'selbststaendig' && (
                        <Alert className="mt-4" variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                ACHTUNG: Bei Selbstständigkeit Rechtsform genau prüfen!
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 4. Vermögenssituation */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>4. Vermögenssituation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="immobilien"
                                    checked={formData.immobilien}
                                    onChange={handleInputChange}
                                    className="h-4 w-4"
                                />
                                <span>Immobilienbesitz vorhanden</span>
                            </label>
                            {formData.immobilien && (
                                <input
                                    type="text"
                                    name="immobilienDetails"
                                    value={formData.immobilienDetails}
                                    onChange={handleInputChange}
                                    placeholder="Details zum Immobilienbesitz"
                                    className="w-full mt-2 p-2 border rounded"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block mb-2">Bankguthaben</label>
                            <input
                                type="number"
                                name="bankguthaben"
                                value={formData.bankguthaben}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 5. Schuldensituation */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>5. Schuldensituation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2">Gesamtschuldenhöhe</label>
                            <input
                                type="number"
                                name="gesamtSchulden"
                                value={formData.gesamtSchulden}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Anzahl Gläubiger</label>
                            <input
                                type="number"
                                name="glaeubiger"
                                value={formData.glaeubiger}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    name="vorherigeInsolvenz"
                                    checked={formData.vorherigeInsolvenz}
                                    onChange={handleInputChange}
                                    className="h-4 w-4"
                                />
                                <span>Vorherige Insolvenz</span>
                            </label>
                            {formData.vorherigeInsolvenz && (
                                <Alert className="mt-2" variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        ACHTUNG: 10-Jahres-Sperrfrist beachten!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 6. Ausschlusskriterien */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>6. Ausschlusskriterien prüfen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {formData.glaeubiger > 25 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    ACHTUNG: Gläubigeranzahl überschreitet Maximum!
                                </AlertDescription>
                            </Alert>
                        )}
                        {formData.vorherigeInsolvenz && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    ACHTUNG: Vorherige Insolvenz - Sperrfrist prüfen!
                                </AlertDescription>
                            </Alert>
                        )}
                        {formData.immobilien && (
                            <Alert variant="warning">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    ACHTUNG: Immobiliensituation muss geklärt werden!
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 7. Preiskalkulation als letzter Abschnitt */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>7. Preiskalkulation & Zahlungsoptionen</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Preisübersicht */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">Kostenaufstellung</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div>Startgebühr Insolvenz:</div>
                                <div className="text-right">{calculatePrice().startgebuehr.toFixed(2)} €</div>

                                <div>Kosten für {formData.glaeubiger || 0} Gläubiger:</div>
                                <div className="text-right">{calculatePrice().glaeubigerKosten.toFixed(2)} €</div>

                                <div className="font-medium pt-2 border-t">Gesamtpreis (Brutto):</div>
                                <div className="text-right font-bold pt-2 border-t">{calculatePrice().gesamtPreis.toFixed(2)} €</div>
                            </div>
                        </div>

                        {/* Ratenzahlungsrechner */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium mb-3">Ratenzahlung</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2">Gewünschte Laufzeit</label>
                                    <select
                                        name="ratenzahlungMonate"
                                        value={formData.ratenzahlungMonate}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="2">2 Monate</option>
                                        <option value="4">4 Monate</option>
                                        <option value="6">6 Monate</option>
                                        <option value="custom">Benutzerdefiniert</option>
                                    </select>
                                </div>

                                {formData.ratenzahlungMonate === 'custom' && (
                                    <div>
                                        <label className="block mb-2">Anzahl der Monate (1-12)</label>
                                        <input
                                            type="number"
                                            name="benutzerdefinierteMonate"
                                            value={formData.benutzerdefinierteMonate || ''}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="12"
                                            className="w-full p-2 border rounded"
                                            placeholder="Anzahl der Monate eingeben"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded mt-4">
                                    <div>Monatliche Rate:</div>
                                    <div className="text-right font-bold">{calculateRates().monatsRate.toFixed(2)} €</div>

                                    <div>Laufzeit:</div>
                                    <div className="text-right">{calculateRates().monate} Monate</div>

                                    <div>Gesamtbetrag:</div>
                                    <div className="text-right">{calculateRates().gesamtPreis.toFixed(2)} €</div>
                                </div>
                            </div>
                        </div>

                        <Alert>
                            <AlertDescription>
                                Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                                Die Berechnung basiert auf einer Startgebühr von 799€ plus 39€ pro Gläubiger.
                                Die Ratenzahlung ist zinslos.
                            </AlertDescription>
                        </Alert>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrivatinsolvenzFormular;
