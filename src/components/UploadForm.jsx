// src/components/UploadForm.jsx
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import './UploadForm.css';
import { themes } from '../themes';
import { boxStyles as defaultBoxStyles } from '../styles';
import { FaUpload } from 'react-icons/fa';


// URL du backend
const BACKEND_URL = 'http://localhost:8000';

const LoadingScreen = ({ status, progress, timeRemaining }) => {
  return (
    <div className="loading-screen">
      <div className="pen-animation" />
      <div className="loading-text">
        {status}
        {timeRemaining > 0 && (
          <div>
            Temps restant estimé : {formatTime(timeRemaining)}
          </div>
        )}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
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
  const [boxStyles, setBoxStyles] = useState({
    intuition: 'green',
    retenir: 'yellow',
    vulgarisation: 'blue',
    recap: 'purple'
  });
  const [loading, setLoading] = useState(false);
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

  // Formatage du temps en minutes et secondes
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_title', courseTitle);
    formData.append('source_language', sourceLang);
    formData.append('target_language', targetLang);
    formData.append('include_intuition', includeIntuition);
    formData.append('include_retenir', includeRetenir);
    formData.append('include_vulgarisation', includeVulgarisation);
    formData.append('include_recap', includeRecap);
    formData.append('box_styles', JSON.stringify(boxStyles));
    formData.append('vulgarization_level', vulgarizationLevel);
    
    // Ajout des options de mise en page
    formData.append('layout_options', JSON.stringify({
      page_format: pageFormat,
      margins: margins,
      font_size: fontSize,
      paragraph_spacing: paragraphSpacing
    }));
    formData.append('box_options', JSON.stringify(boxOptions));

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
      setStatus('Téléchargement du fichier LaTeX...');
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

      setStatus('Téléchargement terminé avec succès !');
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError(err.message);
      setStatus('Erreur lors du téléchargement');
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
      {loading && (
        <LoadingScreen
          status={status}
          progress={progress}
          timeRemaining={timeRemaining}
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

        <div className="form-group">
          <label>Fichier PDF</label>
          <FileInput onChange={(e) => setFile(e.target.files[0])} />
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

        <div className="form-group">
          <label htmlFor="sourceLang">Langue source</label>
          <select
            id="sourceLang"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="targetLang">Langue cible</label>
          <select
            id="targetLang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        {/* Nouvelle section pour les options de mise en page */}
        <div className="layout-options">
          <h3>Options de mise en page</h3>
          
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

        <div className="checkbox-group">
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
            <div className="box-options">
              <h4>Personnalisation "Intuition"</h4>
              <div className="options-grid">
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
          )}

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
            <div className="box-options">
              <h4>Personnalisation "À retenir"</h4>
              <div className="options-grid">
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
                    <option value="\\faStar">Étoile</option>
                    <option value="\\faCheck">Coche</option>
                    <option value="\\faExclamation">Point d'exclamation</option>
                    <option value="\\faFlag">Drapeau</option>
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
          )}

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
            <>
              <div className="vulgarization-options">
                <label htmlFor="vulgarizationLevel">Niveau de vulgarisation :</label>
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
              </div>
              <div className="box-options">
                <h4>Personnalisation "Vulgarisation"</h4>
                <div className="options-grid">
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
                      <option value="\\faComment">Bulle de dialogue</option>
                      <option value="\\faInfoCircle">Information</option>
                      <option value="\\faQuestionCircle">Question</option>
                      <option value="\\faBook">Livre</option>
                      <option value="\\faGraduationCap">Diplôme</option>
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
            </>
          )}

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
            <div className="box-options">
              <h4>Personnalisation "Fiche récapitulative"</h4>
              <div className="options-grid">
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
                    <option value="\\faFileAlt">Document</option>
                    <option value="\\faTasks">Tâches</option>
                    <option value="\\faListAlt">Liste alternative</option>
                    <option value="\\faCheckSquare">Case cochée</option>
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
          )}
        </div>

        <button type="submit" disabled={loading || !file}>
          {loading ? 'Traitement en cours...' : 'Générer le LaTeX'}
        </button>

        {response && (
          <div className="download-section">
            <button onClick={handleDownload} className="download-button">
              Télécharger le fichier LaTeX
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default UploadForm;