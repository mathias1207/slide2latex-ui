// src/components/UploadForm.jsx
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import './UploadForm.css';
import { themes } from '../themes';
import { boxStyles as defaultBoxStyles } from '../styles';
import { FaUpload, FaFileAlt, FaCog, FaLanguage, FaLightbulb, FaBrain, FaBook, FaChartBar } from 'react-icons/fa';


// URL du backend
const BACKEND_URL = 'http://localhost:8000';

// Liste des langues du monde et leurs codes
const languages = [
  { code: "french", name: "Français" },
  { code: "english", name: "Anglais" },
  { code: "german", name: "Allemand" },
  { code: "spanish", name: "Espagnol" },
  { code: "italian", name: "Italien" },
  { code: "portuguese", name: "Portugais" },
  { code: "dutch", name: "Néerlandais" },
  { code: "russian", name: "Russe" },
  { code: "polish", name: "Polonais" },
  { code: "czech", name: "Tchèque" },
  { code: "hungarian", name: "Hongrois" },
  { code: "swedish", name: "Suédois" },
  { code: "finnish", name: "Finnois" },
  { code: "danish", name: "Danois" },
  { code: "norwegian", name: "Norvégien" },
  { code: "greek", name: "Grec" },
  { code: "turkish", name: "Turc" },
  { code: "arabic", name: "Arabe" },
  { code: "hebrew", name: "Hébreu" },
  { code: "hindi", name: "Hindi" },
  { code: "urdu", name: "Ourdou" },
  { code: "persian", name: "Persan" },
  { code: "japanese", name: "Japonais" },
  { code: "chinese", name: "Chinois" },
  { code: "korean", name: "Coréen" },
  { code: "vietnamese", name: "Vietnamien" },
  { code: "thai", name: "Thaï" },
  { code: "indonesian", name: "Indonésien" },
  { code: "malay", name: "Malais" },
  { code: "filipino", name: "Filipino" },
  { code: "amharic", name: "Amharique" },
  { code: "swahili", name: "Swahili" },
  { code: "zulu", name: "Zoulou" },
  { code: "somali", name: "Somali" },
  { code: "romanian", name: "Roumain" },
  { code: "bulgarian", name: "Bulgare" },
  { code: "ukrainian", name: "Ukrainien" },
  { code: "croatian", name: "Croate" },
  { code: "serbian", name: "Serbe" },
  { code: "slovenian", name: "Slovène" },
  { code: "slovak", name: "Slovaque" },
  { code: "lithuanian", name: "Lituanien" },
  { code: "latvian", name: "Letton" },
  { code: "estonian", name: "Estonien" },
  { code: "albanian", name: "Albanais" },
  { code: "macedonian", name: "Macédonien" },
  { code: "georgian", name: "Géorgien" },
  { code: "armenian", name: "Arménien" },
  { code: "azerbaijani", name: "Azerbaïdjanais" },
  { code: "basque", name: "Basque" },
  { code: "catalan", name: "Catalan" },
  { code: "galician", name: "Galicien" },
  { code: "icelandic", name: "Islandais" },
  { code: "maltese", name: "Maltais" },
  { code: "welsh", name: "Gallois" },
  { code: "irish", name: "Irlandais" },
  { code: "scottish", name: "Gaélique écossais" },
  { code: "afrikaans", name: "Afrikaans" },
  // On peut ajouter encore plus de langues si nécessaire
].sort((a, b) => a.name.localeCompare(b.name)); // Tri alphabétique

// Formatage du temps en minutes et secondes
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const LoadingScreen = ({ status, progress, timeRemaining, onDownload }) => {
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "Le saviez-vous ? LaTeX a été créé en 1984 par Leslie Lamport.",
    "Le saviez-vous ? LaTeX est utilisé par plus de 80% des mathématiciens.",
    "Le saviez-vous ? Le nom 'LaTeX' vient de 'Lamport TeX'.",
    "Le saviez-vous ? LaTeX est particulièrement apprécié pour sa gestion des formules mathématiques.",
    "Le saviez-vous ? LaTeX est un logiciel libre et gratuit.",
    "Le saviez-vous ? LaTeX est utilisé par les plus grandes universités du monde."
  ];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(tipInterval);
  }, []);

  const getStatusEmoji = (status) => {
    if (status.includes('Réveil')) return '⚡';
    if (status.includes('Envoi')) return '📤';
    if (status.includes('Traitement')) return '⚙️';
    if (status.includes('Génération')) return '📝';
    if (status.includes('Terminé')) return '✨';
    if (status.includes('Erreur')) return '❌';
    return '🔄';
  };

  return (
    <div className="loading-screen">
      <div className="loading-tip">
        {tips[currentTip]}
      </div>
      <div className="pen-animation" />
      <div className="loading-text">
        <div className="status-main">
          {getStatusEmoji(status)} {status}
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-hint">
        Le traitement est généralement lent... C'est l'occasion parfaite pour aller boire un café ! ☕
      </div>
      {status.includes('Terminé') && (
        <button className="download-button" onClick={onDownload}>
          Télécharger le fichier LaTeX
        </button>
      )}
    </div>
  );
};

const FileInput = ({ onChange }) => {
  const [fileName, setFileName] = useState('Aucun fichier choisi');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      onChange(e);
    }
  };

  return (
    <div className="file-input-container">
      <label className="custom-file-input">
        <FaUpload className="file-icon" />
        <span>Choisir un fichier PDF</span>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </label>
      <div className="file-name">{fileName}</div>
    </div>
  );
};

// Fonction pour estimer le temps de traitement en fonction du modèle et du nombre de pages
const estimateProcessingTime = (modelType, pageCount) => {
  // Temps de base par page en secondes pour chaque modèle
  const baseTimePerPage = {
    fast: 3.6,           // ~3 minutes pour 50 pages
    standard: 6,         // ~5 minutes pour 50 pages
    high_quality: 9.6,   // ~8 minutes pour 50 pages
    premium: 12          // ~10 minutes pour 50 pages
  };
  
  // Calcul du temps estimé en secondes
  const estimatedSeconds = pageCount * baseTimePerPage[modelType];
  
  // Conversion en minutes
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
  
  return estimatedMinutes;
};

// Fonction pour formater la plage de temps (ex: "3-5 min")
const formatTimeRange = (minutes) => {
  const lowerBound = Math.max(1, Math.floor(minutes * 0.8));
  const upperBound = Math.ceil(minutes * 1.2);
  return `${lowerBound}-${upperBound} min`;
};

function UploadForm() {
  const [file, setFile] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [sourceLang, setSourceLang] = useState('french');
  const [targetLang, setTargetLang] = useState('french');
  const [vulgarizationLevel, setVulgarizationLevel] = useState(0);
  const [includeIntuition, setIncludeIntuition] = useState(false);
  const [includeRetenir, setIncludeRetenir] = useState(false);
  const [includeVulgarisation, setIncludeVulgarisation] = useState(false);
  const [includeRecap, setIncludeRecap] = useState(false);
  const [useAllPackages, setUseAllPackages] = useState(false);
  const [boxStyles, setBoxStyles] = useState({
    intuition: 'green',
    retenir: 'yellow',
    vulgarisation: 'blue',
    recap: 'purple'
  });
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('unknown');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('classique');
  const [boxOptions, setBoxOptions] = useState({
    retenir: {
      titleFont: "lmr",
      contentFont: "lmr",
      icon: "\\faBookmark",
      border: "boxrule=1pt",
      background: ""
    },
    intuition: {
      titleFont: "lmr",
      contentFont: "lmr",
      icon: "\\faLightbulb",
      border: "boxrule=1pt",
      background: ""
    },
    vulgarisation: {
      titleFont: "lmr",
      contentFont: "lmr",
      icon: "\\faComment",
      border: "boxrule=1pt",
      background: ""
    },
    recap: {
      titleFont: "lmr",
      contentFont: "lmr",
      icon: "\\faClipboardList",
      border: "boxrule=1pt",
      background: ""
    }
  });

  // Ajout des états pour les options de mise en page
  const [pageFormat, setPageFormat] = useState('a4');
  const [margins, setMargins] = useState({
    top: '2.5',
    right: '2.5',
    bottom: '2.5',
    left: '2.5'
  });
  const [fontSize, setFontSize] = useState('12');
  const [paragraphSpacing, setParagraphSpacing] = useState('1.0');

  // Ajouter cet état dans la fonction UploadForm, parmi les autres états
  const [modelChoice, setModelChoice] = useState("standard");

  // Ajouter un nouvel état dans le composant UploadForm
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');
  const [targetSearchTerm, setTargetSearchTerm] = useState('');

  // Ajouter un état pour gérer les onglets
  const [activeTab, setActiveTab] = useState('general');
  
  // Fonction pour compter les pages du PDF
  const countPages = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return pdfDoc.getPageCount();
    } catch (err) {
      console.error('Erreur lors du comptage des pages:', err);
      return 0;
    }
  };

  // Mettre à jour le temps estimé quand le fichier change
  useEffect(() => {
    if (file) {
      countPages(file).then(count => {
        setPageCount(count);
        // Estimation : 30 secondes par page
        const estimatedSeconds = count * 30;
        setEstimatedTime(estimatedSeconds);
        setTimeRemaining(estimatedSeconds);
      });
    }
  }, [file]);

  // Mettre à jour le temps restant pendant le traitement
  useEffect(() => {
    let timer;
    if (loading && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, timeRemaining]);

  // Fonction pour réveiller le serveur
  const wakeUpServer = async () => {
    try {
      setStatus('Réveil du serveur...');
      const res = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (res.ok) {
        setServerStatus('ready');
        setStatus('Serveur prêt !');
        return true;
      }
    } catch (err) {
      console.error('Erreur lors du réveil du serveur:', err);
    }
    return false;
  };

  // Vérifier l'état du serveur au chargement du composant
  useEffect(() => {
    wakeUpServer();
  }, []);

  const fetchWithTimeout = async (url, options, timeout = 300000) => { // 5 minutes par défaut
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        throw new Error('La requête a expiré. Le serveur met peut-être trop de temps à répondre. Veuillez réessayer.');
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF');
      return;
    }

    // Réveiller le serveur avant de soumettre
    if (serverStatus !== 'ready') {
      setStatus('Réveil du serveur...');
      console.log('Tentative de réveil du serveur...');
      const isReady = await wakeUpServer();
      console.log('État du serveur après réveil:', isReady);
      if (!isReady) {
        setError('Impossible de réveiller le serveur. Veuillez réessayer dans quelques instants.');
        return;
      }
    }

    // Convertir le niveau de vulgarisation en chaîne
    const vulgarizationLevelMap = {
      0: "none",
      1: "minimal",
      2: "light", 
      3: "medium",
      4: "high",
      5: "maximal"
    };
    
    const vulgarizationLevelStr = vulgarizationLevelMap[vulgarizationLevel] || "medium";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_title', courseTitle);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    formData.append('include_intuition', includeIntuition);
    formData.append('include_retenir', includeRetenir);
    formData.append('include_vulgarisation', includeVulgarisation);
    formData.append('include_recap', includeRecap);
    formData.append('box_styles', JSON.stringify(boxStyles));
    formData.append('box_options', JSON.stringify(boxOptions));
    formData.append('vulgarization_level', vulgarizationLevelStr);  // Envoyer la chaîne à la place du nombre
    formData.append('model_choice', modelChoice);
    formData.append('use_all_packages', useAllPackages);
    
    // Ajout des options de mise en page
    formData.append('layout_options', JSON.stringify({
      page_format: pageFormat,
      margins: margins,
      font_size: fontSize,
      paragraph_spacing: paragraphSpacing
    }));

    setLoading(true);
    setProgress(0);
    setUploadProgress(0);
    setStatus('Préparation de l\'envoi...');
    setError(null);

    try {
      // Étape 1: Envoi du fichier
      setStatus('Envoi du fichier au serveur...');
      setProgress(10);
      console.log('Envoi du fichier...');
      console.log('URL du backend:', `${BACKEND_URL}/process/`);

      const res = await fetchWithTimeout(`${BACKEND_URL}/process/`, {
        method: 'POST',
        body: formData,
      }, 300000);

      console.log('Réponse du serveur:', res.status, res.statusText);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Erreur détaillée du serveur:', errorData);
        throw new Error(errorData.detail || `Erreur serveur (${res.status}): ${res.statusText}`);
      }

      // Étape 2: Traitement du fichier
      setStatus('Traitement du fichier par le serveur...');
      setProgress(30);
      console.log('Traitement en cours...');

      const data = await res.json();
      console.log('Réponse du serveur:', data);
      setResponse(data);

      if (!data.file_id) {
        throw new Error('Le serveur n\'a pas retourné d\'identifiant de fichier');
      }

      // Étape 3: Génération du fichier LaTeX
      setStatus('Génération du fichier LaTeX...');
      setProgress(60);

      // Attendre que le fichier soit prêt
      await new Promise(resolve => setTimeout(resolve, 5000));

      setStatus('Terminé avec succès !');
      setProgress(100);

    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(err.message);
      setStatus('Erreur lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!response?.file_id) {
      setError('Aucun fichier à télécharger');
      return;
    }
    
    try {
      setDownloadLoading(true);
      console.log('Tentative de téléchargement pour file_id:', response.file_id);
      console.log('URL de téléchargement:', `${BACKEND_URL}/download/${response.file_id}`);

      const res = await fetchWithTimeout(
        `${BACKEND_URL}/download/${response.file_id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/plain'  // On attend un fichier .tex
          }
        },
        60000  // 60 secondes de timeout
      );

      console.log('Réponse du serveur pour le téléchargement:', res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur de téléchargement:', errorText);
        throw new Error(`Erreur lors du téléchargement (${res.status}): ${errorText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName || `${courseTitle.replace(/\s+/g, '_').toLowerCase() || 'document'}.tex`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!response?.file_id) {
      setError('Aucun fichier PDF à télécharger');
      return;
    }
    
    try {
      setDownloadLoading(true);
      console.log('Tentative de téléchargement PDF pour file_id:', response.file_id);
      console.log('URL de téléchargement PDF:', `${BACKEND_URL}/download-pdf/${response.file_id}`);

      const res = await fetchWithTimeout(
        `${BACKEND_URL}/download-pdf/${response.file_id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf'
          }
        },
        60000
      );

      console.log('Réponse du serveur pour le téléchargement PDF:', res.status, res.statusText);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Le PDF n\'est pas disponible. Veuillez compiler le fichier LaTeX avec Overleaf ou un autre éditeur LaTeX.');
        }
        const errorText = await res.text();
        console.error('Erreur de téléchargement PDF:', errorText);
        throw new Error(`Erreur lors du téléchargement du PDF (${res.status}): ${errorText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseTitle.replace(/\s+/g, '_').toLowerCase() || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err);
      setError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadErrorLog = async () => {
    if (!response?.error_log) {
      setError('Aucun fichier de logs d\'erreur à télécharger');
      return;
    }
    
    try {
      setDownloadLoading(true);
      console.log('Tentative de téléchargement des logs d\'erreur pour file_id:', response.file_id);
      console.log('URL de téléchargement des logs d\'erreur:', `${BACKEND_URL}/error-log/${response.file_id}`);

      const res = await fetchWithTimeout(
        `${BACKEND_URL}/error-log/${response.file_id}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/plain'
          }
        },
        60000
      );

      console.log('Réponse du serveur pour le téléchargement des logs d\'erreur:', res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur de téléchargement des logs d\'erreur:', errorText);
        throw new Error(`Erreur lors du téléchargement des logs d\'erreur (${res.status}): ${errorText}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${courseTitle.replace(/\s+/g, '_').toLowerCase() || 'document'}_error_log.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Erreur lors du téléchargement des logs d\'erreur:', err);
      setError(err.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Fonction pour appliquer un thème
  const applyTheme = (themeKey) => {
    setCurrentTheme(themeKey);
    setBoxStyles(themes[themeKey].styles);
  };

  const handleBoxOptionChange = (boxType, optionType, value) => {
    setBoxOptions(prev => ({
      ...prev,
      [boxType]: {
        ...prev[boxType],
        [optionType]: value
      }
    }));
  };

  return (
    <div className="form-container">
      {loading && !downloadLoading && (
        <LoadingScreen
          status={status}
          progress={progress}
          timeRemaining={timeRemaining}
          onDownload={handleDownload}
        />
      )}
      <form className="upload-form" onSubmit={handleSubmit}>
        <h2>Générateur de polycopié LaTeX</h2>
        
        {error && (
          <div className="error-message">
            {error}
            <div className="error-suggestion">
              Essayez de rafraîchir la page ou de réessayer dans quelques instants.
            </div>
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="tabs-navigation">
          <div className={`tab-button ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            <div className="tab-icon"><FaFileAlt /></div>
            <div className="tab-label">Général</div>
            <div className="tab-description">Fichier et titre</div>
          </div>
          <div className={`tab-button ${activeTab === 'language' ? 'active' : ''}`} onClick={() => setActiveTab('language')}>
            <div className="tab-icon"><FaLanguage /></div>
            <div className="tab-label">Langues</div>
            <div className="tab-description">Source et cible</div>
          </div>
          <div className={`tab-button ${activeTab === 'layout' ? 'active' : ''}`} onClick={() => setActiveTab('layout')}>
            <div className="tab-icon"><FaCog /></div>
            <div className="tab-label">Mise en page</div>
            <div className="tab-description">Format et marges</div>
          </div>
          <div className={`tab-button ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <div className="tab-icon"><FaLightbulb /></div>
            <div className="tab-label">Contenu</div>
            <div className="tab-description">Sections spéciales</div>
          </div>
          <div className={`tab-button ${activeTab === 'model' ? 'active' : ''}`} onClick={() => setActiveTab('model')}>
            <div className="tab-icon"><FaBrain /></div>
            <div className="tab-label">IA</div>
            <div className="tab-description">Modèle et qualité</div>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="tab-content">
          {/* Onglet Général */}
          {activeTab === 'general' && (
            <div className="tab-pane">
              <div className="form-group">
                <label>Fichier PDF</label>
                <FileInput onChange={(e) => setFile(e.target.files[0])} />
                {pageCount > 0 && (
                  <div className="file-info mt-2">
                    <span className="badge bg-info">
                      {pageCount} {pageCount > 1 ? 'pages' : 'page'} détectées
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="courseTitle">Titre du cours</label>
                <input
                  type="text"
                  id="courseTitle"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Onglet Langues */}
          {activeTab === 'language' && (
            <div className="tab-pane">
              <div className="two-columns">
                <div className="column">
                  <div className="form-group">
                    <label htmlFor="sourceLang">Langue source</label>
                    <div className="language-selector">
                      <input
                        type="text"
                        placeholder="Rechercher une langue..."
                        value={sourceSearchTerm}
                        onChange={(e) => setSourceSearchTerm(e.target.value)}
                        className="language-search"
                      />
                      <select
                        id="sourceLang"
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="select-input"
                      >
                        {languages
                          .filter(lang => 
                            lang.name.toLowerCase().includes(sourceSearchTerm.toLowerCase()) ||
                            lang.code.toLowerCase().includes(sourceSearchTerm.toLowerCase())
                          )
                          .map(lang => (
                            <option key={`source-${lang.code}`} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="column">
                  <div className="form-group">
                    <label htmlFor="targetLang">Langue cible</label>
                    <div className="language-selector">
                      <input
                        type="text"
                        placeholder="Rechercher une langue..."
                        value={targetSearchTerm}
                        onChange={(e) => setTargetSearchTerm(e.target.value)}
                        className="language-search"
                      />
                      <select
                        id="targetLang"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="select-input"
                      >
                        {languages
                          .filter(lang => 
                            lang.name.toLowerCase().includes(targetSearchTerm.toLowerCase()) ||
                            lang.code.toLowerCase().includes(targetSearchTerm.toLowerCase())
                          )
                          .map(lang => (
                            <option key={`target-${lang.code}`} value={lang.code}>
                              {lang.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Mise en page */}
          {activeTab === 'layout' && (
            <div className="tab-pane">
              <div className="two-columns">
                <div className="column">
                  <div className="form-group">
                    <label htmlFor="pageFormat">Format de page</label>
                    <select
                      id="pageFormat"
                      value={pageFormat}
                      onChange={(e) => setPageFormat(e.target.value)}
                      className="select-input"
                    >
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="letter">Letter (216 × 279 mm)</option>
                      <option value="a5">A5 (148 × 210 mm)</option>
                      <option value="b5">B5 (176 × 250 mm)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fontSize">Taille de police (pt)</label>
                    <select
                      id="fontSize"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="select-input"
                    >
                      <option value="10">10 pt</option>
                      <option value="11">11 pt</option>
                      <option value="12">12 pt</option>
                      <option value="14">14 pt</option>
                      <option value="16">16 pt</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="paragraphSpacing">Espacement des paragraphes</label>
                    <select
                      id="paragraphSpacing"
                      value={paragraphSpacing}
                      onChange={(e) => setParagraphSpacing(e.target.value)}
                      className="select-input"
                    >
                      <option value="1.0">Simple (1.0)</option>
                      <option value="1.15">Confortable (1.15)</option>
                      <option value="1.5">Large (1.5)</option>
                      <option value="2.0">Double (2.0)</option>
                    </select>
                  </div>
                </div>

                <div className="column">
                  <div className="margins-group">
                    <h4>Marges (cm)</h4>
                    <div className="margins-grid">
                      <div className="margin-input">
                        <label htmlFor="marginTop">Haut</label>
                        <input
                          type="number"
                          id="marginTop"
                          value={margins.top}
                          onChange={(e) => setMargins({...margins, top: e.target.value})}
                          min="1"
                          max="10"
                          step="0.1"
                        />
                      </div>
                      <div className="margin-input">
                        <label htmlFor="marginRight">Droite</label>
                        <input
                          type="number"
                          id="marginRight"
                          value={margins.right}
                          onChange={(e) => setMargins({...margins, right: e.target.value})}
                          min="1"
                          max="10"
                          step="0.1"
                        />
                      </div>
                      <div className="margin-input">
                        <label htmlFor="marginBottom">Bas</label>
                        <input
                          type="number"
                          id="marginBottom"
                          value={margins.bottom}
                          onChange={(e) => setMargins({...margins, bottom: e.target.value})}
                          min="1"
                          max="10"
                          step="0.1"
                        />
                      </div>
                      <div className="margin-input">
                        <label htmlFor="marginLeft">Gauche</label>
                        <input
                          type="number"
                          id="marginLeft"
                          value={margins.left}
                          onChange={(e) => setMargins({...margins, left: e.target.value})}
                          min="1"
                          max="10"
                          step="0.1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Contenu */}
          {activeTab === 'content' && (
            <div className="tab-pane">
              <div className="content-options">
                <div className="content-option-item">
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="includeIntuition"
                      checked={includeIntuition}
                      onChange={(e) => setIncludeIntuition(e.target.checked)}
                    />
                    <label htmlFor="includeIntuition">Inclure les intuitions</label>
                  </div>
                  {includeIntuition && (
                    <button 
                      type="button" 
                      className="config-button"
                      onClick={() => document.getElementById('intuitionModal').showModal()}
                    >
                      ⚙️ Configurer
                    </button>
                  )}
                </div>

                <div className="content-option-item">
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="includeRetenir"
                      checked={includeRetenir}
                      onChange={(e) => setIncludeRetenir(e.target.checked)}
                    />
                    <label htmlFor="includeRetenir">Inclure les points à retenir</label>
                  </div>
                  {includeRetenir && (
                    <button 
                      type="button" 
                      className="config-button"
                      onClick={() => document.getElementById('retenirModal').showModal()}
                    >
                      ⚙️ Configurer
                    </button>
                  )}
                </div>

                <div className="content-option-item">
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="includeVulgarisation"
                      checked={includeVulgarisation}
                      onChange={(e) => setIncludeVulgarisation(e.target.checked)}
                    />
                    <label htmlFor="includeVulgarisation">Inclure la vulgarisation</label>
                  </div>
                  {includeVulgarisation && (
                    <div className="inline-options">
                      <select
                        id="vulgarizationLevel"
                        value={vulgarizationLevel}
                        onChange={(e) => setVulgarizationLevel(parseInt(e.target.value))}
                        className="select-input"
                      >
                        <option value="0">Aucune vulgarisation</option>
                        <option value="1">Niveau 1 - Minimal</option>
                        <option value="2">Niveau 2 - Léger</option>
                        <option value="3">Niveau 3 - Modéré</option>
                        <option value="4">Niveau 4 - Élevé</option>
                        <option value="5">Niveau 5 - Maximal</option>
                      </select>
                      <button 
                        type="button" 
                        className="config-button"
                        onClick={() => document.getElementById('vulgarisationModal').showModal()}
                      >
                        ⚙️ Configurer
                      </button>
                    </div>
                  )}
                </div>

                <div className="content-option-item">
                  <div className="checkbox-label">
                    <input
                      type="checkbox"
                      id="includeRecap"
                      checked={includeRecap}
                      onChange={(e) => setIncludeRecap(e.target.checked)}
                    />
                    <label htmlFor="includeRecap">Inclure les fiches récapitulatives</label>
                  </div>
                  {includeRecap && (
                    <button 
                      type="button" 
                      className="config-button"
                      onClick={() => document.getElementById('recapModal').showModal()}
                    >
                      ⚙️ Configurer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Modèle IA */}
          {activeTab === 'model' && (
            <div className="tab-pane">
              <div className="form-group">
                <label className="fw-bold mb-2">Qualité du traitement :</label>
                <div className="model-selector">
                  <select 
                    className="form-control"
                    value={modelChoice} 
                    onChange={(e) => setModelChoice(e.target.value)}
                  >
                    <option value="fast">
                      Rapide - Qualité basique {pageCount > 0 ? `(${formatTimeRange(estimateProcessingTime('fast', pageCount))})` : ''}
                    </option>
                    <option value="standard">
                      Standard - Équilibré {pageCount > 0 ? `(${formatTimeRange(estimateProcessingTime('standard', pageCount))})` : ''}
                    </option>
                    <option value="high_quality">
                      Haute qualité - Meilleur contenu {pageCount > 0 ? `(${formatTimeRange(estimateProcessingTime('high_quality', pageCount))})` : ''}
                    </option>
                    <option value="premium">
                      Premium - Qualité maximale {pageCount > 0 ? `(${formatTimeRange(estimateProcessingTime('premium', pageCount))})` : ''}
                    </option>
                  </select>
                  <div className="model-info mt-2 text-muted small">
                    <p className="mb-1">
                      <i className="fas fa-info-circle me-1"></i>
                      {pageCount > 0 
                        ? `Temps estimés pour un document de ${pageCount} pages` 
                        : 'Chargez un document pour voir les temps estimés précis'}
                    </p>
                    <div className="mt-2 p-2 border rounded bg-light">
                      <p className="mb-1"><strong>Rapide</strong> : GPT-4o avec analyse rapide - Pour tests ou documents simples</p>
                      <p className="mb-1"><strong>Standard</strong> : GPT-4o avec analyse standard - Pour l'usage courant</p>
                      <p className="mb-1"><strong>Haute qualité</strong> : GPT-4o avec analyse approfondie - Pour du contenu technique complexe</p>
                      <p className="mb-0"><strong>Premium</strong> : GPT-4o + correction détaillée - Pour les documents critiques</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group mt-4">
                {/* Option désactivée - tous les packages */}
                {/*
                <div className="packages-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="useAllPackages"
                      checked={useAllPackages}
                      onChange={(e) => setUseAllPackages(e.target.checked)}
                    />
                    <span>Inclure tous les packages LaTeX (~8000 packages)</span>
                  </label>
                  <div className="packages-info">
                    <p>
                      Lorsque cette option est activée, tous les packages définis dans le fichier "packages.txt" seront inclus dans le document LaTeX généré.
                      Cela peut augmenter la compatibilité mais aussi ralentir la compilation et potentiellement créer des conflits.
                    </p>
                  </div>
                </div>
                */}
              </div>
            </div>
          )}
        </div>

        <div className="form-submit">
          <button type="submit" disabled={loading || !file}>
            {loading ? 'Traitement en cours...' : 'Générer le LaTeX'}
          </button>

          {response && (
            <div className="download-section">
              <button onClick={handleDownload} className="download-button" disabled={downloadLoading}>
                {downloadLoading ? 'Téléchargement en cours...' : 'Télécharger le fichier LaTeX'}
              </button>
              <button 
                onClick={handleDownloadPDF} 
                className="download-button pdf-button" 
                disabled={downloadLoading}
              >
                Télécharger le PDF (si disponible)
              </button>
              <button
                onClick={handleDownloadErrorLog}
                className="download-button log-button"
                disabled={downloadLoading}
              >
                Télécharger les logs d'erreur
              </button>
              <div className="info-note">
                <p>Note: Le fichier LaTeX est prêt à être compilé sur Overleaf. Le PDF peut ne pas être disponible si la compilation sur le serveur a échoué.</p>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Modals pour la configuration détaillée des boîtes */}
      <dialog id="intuitionModal" className="config-modal">
        <div className="modal-header">
          <h3>Configuration des boîtes "Intuition"</h3>
          <button onClick={() => document.getElementById('intuitionModal').close()} className="close-button">&times;</button>
        </div>
        <div className="modal-content">
          <div className="box-preview">
            <h4>Aperçu</h4>
            <div className="preview-box" style={{backgroundColor: `${boxStyles.intuition}!5!white`, borderColor: `${boxStyles.intuition}`}}>
              <div className="preview-title" style={{borderColor: `${boxStyles.intuition}`, backgroundColor: 'white'}}>
                {boxOptions.intuition.icon === '\\faLightbulb' && '💡'} 
                {boxOptions.intuition.icon === '\\faThoughtBubble' && '💭'}
                {boxOptions.intuition.icon === '\\faBrain' && '🧠'}
                {boxOptions.intuition.icon === '\\faCompass' && '🧭'}
                {boxOptions.intuition.icon === '\\faMagic' && '✨'} 
                Intuition
              </div>
              <div className="preview-content">
                Cette boîte fournit une explication intuitive du concept abordé dans cette section. Elle aide à comprendre l'idée de manière plus concrète.
              </div>
            </div>
          </div>
          
          <div className="box-options">
            <div className="options-grid">
              <div className="option-group">
                <label>Couleur :</label>
                <select
                  value={boxStyles.intuition}
                  onChange={(e) => setBoxStyles({...boxStyles, intuition: e.target.value})}
                  className="select-input"
                >
                  <option value="green">Vert</option>
                  <option value="blue">Bleu</option>
                  <option value="red">Rouge</option>
                  <option value="yellow">Jaune</option>
                  <option value="purple">Violet</option>
                  <option value="gray">Gris</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Turquoise</option>
                </select>
              </div>
            
              <div className="option-group">
                <label>Police du titre :</label>
                <select
                  value={boxOptions.intuition.titleFont}
                  onChange={(e) => handleBoxOptionChange('intuition', 'titleFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Police du contenu :</label>
                <select
                  value={boxOptions.intuition.contentFont}
                  onChange={(e) => handleBoxOptionChange('intuition', 'contentFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Icône :</label>
                <select
                  value={boxOptions.intuition.icon}
                  onChange={(e) => handleBoxOptionChange('intuition', 'icon', e.target.value)}
                  className="select-input"
                >
                  <option value="\\faLightbulb">Ampoule</option>
                  <option value="\\faThoughtBubble">Bulle de pensée</option>
                  <option value="\\faBrain">Cerveau</option>
                  <option value="\\faCompass">Boussole</option>
                  <option value="\\faMagic">Baguette magique</option>
                </select>
              </div>

              <div className="option-group">
                <label>Style de bordure :</label>
                <select
                  value={boxOptions.intuition.border}
                  onChange={(e) => handleBoxOptionChange('intuition', 'border', e.target.value)}
                  className="select-input"
                >
                  <option value="boxrule=1pt">Simple (1pt)</option>
                  <option value="boxrule=2pt,double">Double</option>
                  <option value="boxrule=1pt,dotted">Pointillés</option>
                  <option value="boxrule=1pt,dashed">Tirets</option>
                  <option value="boxrule=3pt">Épais (3pt)</option>
                </select>
              </div>

              <div className="option-group">
                <label>Arrière-plan :</label>
                <select
                  value={boxOptions.intuition.background}
                  onChange={(e) => handleBoxOptionChange('intuition', 'background', e.target.value)}
                  className="select-input"
                >
                  <option value="">Uni (défaut)</option>
                  <option value="grid">Grille</option>
                  <option value="dots">Points</option>
                  <option value="crosshatch">Hachures</option>
                  <option value="gradient">Dégradé</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => document.getElementById('intuitionModal').close()} className="button">Fermer</button>
          </div>
        </div>
      </dialog>

      {/* Modale pour la configuration des boîtes "Retenir" */}
      <dialog id="retenirModal" className="config-modal">
        <div className="modal-header">
          <h3>Configuration des boîtes "À retenir"</h3>
          <button onClick={() => document.getElementById('retenirModal').close()} className="close-button">&times;</button>
        </div>
        <div className="modal-content">
          <div className="box-preview">
            <h4>Aperçu</h4>
            <div className="preview-box" style={{backgroundColor: `${boxStyles.retenir}!5!white`, borderColor: `${boxStyles.retenir}`}}>
              <div className="preview-title" style={{borderColor: `${boxStyles.retenir}`, backgroundColor: 'white'}}>
                {boxOptions.retenir.icon === '\\faBookmark' && '🔖'} 
                {boxOptions.retenir.icon === '\\faCheck' && '✓'}
                {boxOptions.retenir.icon === '\\faStar' && '⭐'}
                {boxOptions.retenir.icon === '\\faExclamation' && '❗'}
                {boxOptions.retenir.icon === '\\faMemory' && '🧠'} 
                À retenir
              </div>
              <div className="preview-content">
                Cette boîte contient les points essentiels à retenir de cette section. Elle résume les formules et définitions clés.
              </div>
            </div>
          </div>
          
          <div className="box-options">
            <div className="options-grid">
              <div className="option-group">
                <label>Couleur :</label>
                <select
                  value={boxStyles.retenir}
                  onChange={(e) => setBoxStyles({...boxStyles, retenir: e.target.value})}
                  className="select-input"
                >
                  <option value="yellow">Jaune</option>
                  <option value="green">Vert</option>
                  <option value="blue">Bleu</option>
                  <option value="red">Rouge</option>
                  <option value="purple">Violet</option>
                  <option value="gray">Gris</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Turquoise</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>Police du titre :</label>
                <select
                  value={boxOptions.retenir.titleFont}
                  onChange={(e) => handleBoxOptionChange('retenir', 'titleFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Police du contenu :</label>
                <select
                  value={boxOptions.retenir.contentFont}
                  onChange={(e) => handleBoxOptionChange('retenir', 'contentFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Icône :</label>
                <select
                  value={boxOptions.retenir.icon}
                  onChange={(e) => handleBoxOptionChange('retenir', 'icon', e.target.value)}
                  className="select-input"
                >
                  <option value="\\faBookmark">Marque-page</option>
                  <option value="\\faCheck">Checkmark</option>
                  <option value="\\faStar">Étoile</option>
                  <option value="\\faExclamation">Point d'exclamation</option>
                  <option value="\\faMemory">Mémoire</option>
                </select>
              </div>

              <div className="option-group">
                <label>Style de bordure :</label>
                <select
                  value={boxOptions.retenir.border}
                  onChange={(e) => handleBoxOptionChange('retenir', 'border', e.target.value)}
                  className="select-input"
                >
                  <option value="boxrule=1pt">Simple (1pt)</option>
                  <option value="boxrule=2pt,double">Double</option>
                  <option value="boxrule=1pt,dotted">Pointillés</option>
                  <option value="boxrule=1pt,dashed">Tirets</option>
                  <option value="boxrule=3pt">Épais (3pt)</option>
                </select>
              </div>

              <div className="option-group">
                <label>Arrière-plan :</label>
                <select
                  value={boxOptions.retenir.background}
                  onChange={(e) => handleBoxOptionChange('retenir', 'background', e.target.value)}
                  className="select-input"
                >
                  <option value="">Uni (défaut)</option>
                  <option value="grid">Grille</option>
                  <option value="dots">Points</option>
                  <option value="crosshatch">Hachures</option>
                  <option value="gradient">Dégradé</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => document.getElementById('retenirModal').close()} className="button">Fermer</button>
          </div>
        </div>
      </dialog>

      {/* Modale pour la configuration des boîtes "Vulgarisation" */}
      <dialog id="vulgarisationModal" className="config-modal">
        <div className="modal-header">
          <h3>Configuration des boîtes "Vulgarisation"</h3>
          <button onClick={() => document.getElementById('vulgarisationModal').close()} className="close-button">&times;</button>
        </div>
        <div className="modal-content">
          <div className="box-preview">
            <h4>Aperçu</h4>
            <div className="preview-box" style={{backgroundColor: `${boxStyles.vulgarisation}!5!white`, borderColor: `${boxStyles.vulgarisation}`}}>
              <div className="preview-title" style={{borderColor: `${boxStyles.vulgarisation}`, backgroundColor: 'white'}}>
                {boxOptions.vulgarisation.icon === '\\faComment' && '💬'} 
                {boxOptions.vulgarisation.icon === '\\faInfoCircle' && 'ℹ️'}
                {boxOptions.vulgarisation.icon === '\\faQuestionCircle' && '❓'}
                {boxOptions.vulgarisation.icon === '\\faGlasses' && '👓'}
                {boxOptions.vulgarisation.icon === '\\faHandPointRight' && '👉'} 
                Vulgarisation simple
              </div>
              <div className="preview-content">
                Cette boîte explique les concepts de façon simplifiée. Elle utilise des analogies et un vocabulaire accessible pour faciliter la compréhension.
              </div>
            </div>
          </div>
          
          <div className="box-options">
            <div className="options-grid">
              <div className="option-group">
                <label>Couleur :</label>
                <select
                  value={boxStyles.vulgarisation}
                  onChange={(e) => setBoxStyles({...boxStyles, vulgarisation: e.target.value})}
                  className="select-input"
                >
                  <option value="blue">Bleu</option>
                  <option value="green">Vert</option>
                  <option value="red">Rouge</option>
                  <option value="yellow">Jaune</option>
                  <option value="purple">Violet</option>
                  <option value="gray">Gris</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Turquoise</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>Police du titre :</label>
                <select
                  value={boxOptions.vulgarisation.titleFont}
                  onChange={(e) => handleBoxOptionChange('vulgarisation', 'titleFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Police du contenu :</label>
                <select
                  value={boxOptions.vulgarisation.contentFont}
                  onChange={(e) => handleBoxOptionChange('vulgarisation', 'contentFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Icône :</label>
                <select
                  value={boxOptions.vulgarisation.icon}
                  onChange={(e) => handleBoxOptionChange('vulgarisation', 'icon', e.target.value)}
                  className="select-input"
                >
                  <option value="\\faComment">Commentaire</option>
                  <option value="\\faInfoCircle">Information</option>
                  <option value="\\faQuestionCircle">Question</option>
                  <option value="\\faGlasses">Lunettes</option>
                  <option value="\\faHandPointRight">Main qui pointe</option>
                </select>
              </div>

              <div className="option-group">
                <label>Style de bordure :</label>
                <select
                  value={boxOptions.vulgarisation.border}
                  onChange={(e) => handleBoxOptionChange('vulgarisation', 'border', e.target.value)}
                  className="select-input"
                >
                  <option value="boxrule=1pt">Simple (1pt)</option>
                  <option value="boxrule=2pt,double">Double</option>
                  <option value="boxrule=1pt,dotted">Pointillés</option>
                  <option value="boxrule=1pt,dashed">Tirets</option>
                  <option value="boxrule=3pt">Épais (3pt)</option>
                </select>
              </div>

              <div className="option-group">
                <label>Arrière-plan :</label>
                <select
                  value={boxOptions.vulgarisation.background}
                  onChange={(e) => handleBoxOptionChange('vulgarisation', 'background', e.target.value)}
                  className="select-input"
                >
                  <option value="">Uni (défaut)</option>
                  <option value="grid">Grille</option>
                  <option value="dots">Points</option>
                  <option value="crosshatch">Hachures</option>
                  <option value="gradient">Dégradé</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => document.getElementById('vulgarisationModal').close()} className="button">Fermer</button>
          </div>
        </div>
      </dialog>

      {/* Modale pour la configuration des boîtes "Récap" */}
      <dialog id="recapModal" className="config-modal">
        <div className="modal-header">
          <h3>Configuration des boîtes "Récapitulatif"</h3>
          <button onClick={() => document.getElementById('recapModal').close()} className="close-button">&times;</button>
        </div>
        <div className="modal-content">
          <div className="box-preview">
            <h4>Aperçu</h4>
            <div className="preview-box" style={{backgroundColor: `${boxStyles.recap}!5!white`, borderColor: `${boxStyles.recap}`}}>
              <div className="preview-title" style={{borderColor: `${boxStyles.recap}`, backgroundColor: 'white'}}>
                {boxOptions.recap.icon === '\\faClipboardList' && '📋'} 
                {boxOptions.recap.icon === '\\faListAlt' && '📄'}
                {boxOptions.recap.icon === '\\faTasks' && '✓'}
                {boxOptions.recap.icon === '\\faFileAlt' && '📝'}
                {boxOptions.recap.icon === '\\faChartBar' && '📊'} 
                Fiche Récapitulative
              </div>
              <div className="preview-content">
                <p><strong>Objectif :</strong> Résumer le concept principal de cette section.</p>
                <p><strong>Principe central :</strong> Explication concise de l'idée fondamentale.</p>
                <p><strong>Points essentiels :</strong></p>
                <ul>
                  <li>Premier point important</li>
                  <li>Second point important</li>
                  <li>Troisième point important</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="box-options">
            <div className="options-grid">
              <div className="option-group">
                <label>Couleur :</label>
                <select
                  value={boxStyles.recap}
                  onChange={(e) => setBoxStyles({...boxStyles, recap: e.target.value})}
                  className="select-input"
                >
                  <option value="purple">Violet</option>
                  <option value="green">Vert</option>
                  <option value="blue">Bleu</option>
                  <option value="red">Rouge</option>
                  <option value="yellow">Jaune</option>
                  <option value="gray">Gris</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Turquoise</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>Police du titre :</label>
                <select
                  value={boxOptions.recap.titleFont}
                  onChange={(e) => handleBoxOptionChange('recap', 'titleFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Police du contenu :</label>
                <select
                  value={boxOptions.recap.contentFont}
                  onChange={(e) => handleBoxOptionChange('recap', 'contentFont', e.target.value)}
                  className="select-input"
                >
                  <option value="lmr">Latin Modern Roman</option>
                  <option value="phv">Helvetica</option>
                  <option value="ptm">Times New Roman</option>
                  <option value="ppl">Palatino</option>
                  <option value="pbk">Bookman</option>
                </select>
              </div>

              <div className="option-group">
                <label>Icône :</label>
                <select
                  value={boxOptions.recap.icon}
                  onChange={(e) => handleBoxOptionChange('recap', 'icon', e.target.value)}
                  className="select-input"
                >
                  <option value="\\faClipboardList">Liste</option>
                  <option value="\\faListAlt">Liste alternative</option>
                  <option value="\\faTasks">Tâches</option>
                  <option value="\\faFileAlt">Document</option>
                  <option value="\\faChartBar">Graphique</option>
                </select>
              </div>

              <div className="option-group">
                <label>Style de bordure :</label>
                <select
                  value={boxOptions.recap.border}
                  onChange={(e) => handleBoxOptionChange('recap', 'border', e.target.value)}
                  className="select-input"
                >
                  <option value="boxrule=1pt">Simple (1pt)</option>
                  <option value="boxrule=2pt,double">Double</option>
                  <option value="boxrule=1pt,dotted">Pointillés</option>
                  <option value="boxrule=1pt,dashed">Tirets</option>
                  <option value="boxrule=3pt">Épais (3pt)</option>
                </select>
              </div>

              <div className="option-group">
                <label>Arrière-plan :</label>
                <select
                  value={boxOptions.recap.background}
                  onChange={(e) => handleBoxOptionChange('recap', 'background', e.target.value)}
                  className="select-input"
                >
                  <option value="">Uni (défaut)</option>
                  <option value="grid">Grille</option>
                  <option value="dots">Points</option>
                  <option value="crosshatch">Hachures</option>
                  <option value="gradient">Dégradé</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={() => document.getElementById('recapModal').close()} className="button">Fermer</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default UploadForm;