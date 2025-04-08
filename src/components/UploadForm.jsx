// src/components/UploadForm.jsx
import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import './UploadForm.css';

// URL du backend
const BACKEND_URL = 'http://localhost:8000';

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

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="upload-form">
        <h2>Convertir un cours PDF</h2>

        {error && (
          <div className="error-message">
            {error}
            <p className="error-suggestion">
              Si le problème persiste, essayez de :
              <ul>
                <li>Réduire la taille du fichier PDF</li>
                <li>Attendre quelques minutes avant de réessayer</li>
                <li>Vérifier votre connexion internet</li>
              </ul>
            </p>
          </div>
        )}

        {file && !loading && (
          <div className="file-info">
            <p>Nombre de pages : {pageCount}</p>
            <p>Temps estimé : {formatTime(estimatedTime)}</p>
            <p>Fichier de sortie : {downloadFileName}</p>
          </div>
        )}

        <div className="form-group">
          <label className="file-input-label">
            <span>Choisir un fichier PDF</span>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
            />
          </label>
          {file && <p className="file-name">{file.name}</p>}
        </div>

        <div className="form-group">
          <input
            type="text"
            placeholder="Titre du cours"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            className="text-input"
          />
        </div>

        <div className="form-group">
          <label>Langue source :</label>
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="select-input">
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        <div className="form-group">
          <label>Langue cible :</label>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="select-input">
            <option value="french">Français</option>
            <option value="english">Anglais</option>
            <option value="hebrew">Hébreu</option>
          </select>
        </div>

        <div className="form-group">
          <h3>Options de génération</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeIntuition}
                onChange={(e) => setIncludeIntuition(e.target.checked)}
              />
              Inclure des boîtes "Intuition"
            </label>
            {includeIntuition && (
              <select
                value={boxStyles.intuition}
                onChange={(e) => setBoxStyles({...boxStyles, intuition: e.target.value})}
                className="select-input"
              >
                <option value="green">Vert (Classique)</option>
                <option value="yellow">Jaune</option>
                <option value="blue">Bleu</option>
                <option value="red">Rouge</option>
                <option value="purple">Violet</option>
                <option value="orange">Orange</option>
              </select>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeRetenir}
                onChange={(e) => setIncludeRetenir(e.target.checked)}
              />
              Inclure des boîtes "À retenir"
            </label>
            {includeRetenir && (
              <select
                value={boxStyles.retenir}
                onChange={(e) => setBoxStyles({...boxStyles, retenir: e.target.value})}
                className="select-input"
              >
                <option value="yellow">Jaune (Classique)</option>
                <option value="green">Vert</option>
                <option value="blue">Bleu</option>
                <option value="red">Rouge</option>
                <option value="purple">Violet</option>
                <option value="orange">Orange</option>
              </select>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeVulgarisation}
                onChange={(e) => setIncludeVulgarisation(e.target.checked)}
              />
              Inclure des boîtes "Vulgarisation"
            </label>
            {includeVulgarisation && (
              <div className="vulgarization-options">
                <select
                  value={boxStyles.vulgarisation}
                  onChange={(e) => setBoxStyles({...boxStyles, vulgarisation: e.target.value})}
                  className="select-input"
                >
                  <option value="blue">Bleu (Classique)</option>
                  <option value="green">Vert</option>
                  <option value="yellow">Jaune</option>
                  <option value="red">Rouge</option>
                  <option value="purple">Violet</option>
                  <option value="orange">Orange</option>
                </select>
                <select
                  value={vulgarizationLevel}
                  onChange={(e) => setVulgarizationLevel(Number(e.target.value))}
                  className="select-input"
                >
                  <option value={1}>Niveau 1 - Minimal</option>
                  <option value={2}>Niveau 2 - Léger</option>
                  <option value={3}>Niveau 3 - Modéré</option>
                  <option value={4}>Niveau 4 - Élevé</option>
                  <option value={5}>Niveau 5 - Maximal</option>
                </select>
              </div>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeRecap}
                onChange={(e) => setIncludeRecap(e.target.checked)}
              />
              Inclure des fiches récapitulatives
            </label>
            {includeRecap && (
              <select
                value={boxStyles.recap}
                onChange={(e) => setBoxStyles({...boxStyles, recap: e.target.value})}
                className="select-input"
              >
                <option value="purple">Violet (Classique)</option>
                <option value="green">Vert</option>
                <option value="blue">Bleu</option>
                <option value="red">Rouge</option>
                <option value="yellow">Jaune</option>
                <option value="orange">Orange</option>
              </select>
            )}
          </div>
        </div>

        <div className="box-preview">
          <h4>Prévisualisation :</h4>
          <div className="preview-container">
            {includeIntuition && (
              <div 
                className="preview-box"
                style={{
                  backgroundColor: `${boxStyles.intuition}15`,
                  borderColor: `${boxStyles.intuition}80`,
                  borderLeft: `4px solid ${boxStyles.intuition}`
                }}
              >
                <div className="preview-title" style={{ color: `${boxStyles.intuition}80` }}>
                  <i className="fas fa-lightbulb"></i> Intuition
                </div>
                <div className="preview-content">
                  Ceci est un exemple de boîte "Intuition"
                </div>
              </div>
            )}

            {includeRetenir && (
              <div 
                className="preview-box"
                style={{
                  backgroundColor: `${boxStyles.retenir}15`,
                  borderColor: `${boxStyles.retenir}80`,
                  borderLeft: `4px solid ${boxStyles.retenir}`
                }}
              >
                <div className="preview-title" style={{ color: `${boxStyles.retenir}80` }}>
                  <i className="fas fa-bookmark"></i> À retenir
                </div>
                <div className="preview-content">
                  Ceci est un exemple de boîte "À retenir"
                </div>
              </div>
            )}

            {includeVulgarisation && (
              <div 
                className="preview-box"
                style={{
                  backgroundColor: `${boxStyles.vulgarisation}15`,
                  borderColor: `${boxStyles.vulgarisation}80`,
                  borderLeft: `4px solid ${boxStyles.vulgarisation}`
                }}
              >
                <div className="preview-title" style={{ color: `${boxStyles.vulgarisation}80` }}>
                  <i className="fas fa-comment"></i> Vulgarisation (Niveau {vulgarizationLevel})
                </div>
                <div className="preview-content">
                  Ceci est un exemple de boîte "Vulgarisation"
                </div>
              </div>
            )}

            {includeRecap && (
              <div 
                className="preview-box"
                style={{
                  backgroundColor: `${boxStyles.recap}15`,
                  borderColor: `${boxStyles.recap}80`,
                  borderLeft: `4px solid ${boxStyles.recap}`
                }}
              >
                <div className="preview-title" style={{ color: `${boxStyles.recap}80` }}>
                  <i className="fas fa-clipboard-list"></i> Fiche Récapitulative
                </div>
                <div className="preview-content">
                  Ceci est un exemple de fiche récapitulative
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || serverStatus !== 'ready'} 
          className="submit-button"
        >
          {loading ? 'Envoi en cours...' : serverStatus === 'ready' ? 'Envoyer' : 'Serveur en veille...'}
        </button>

        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {uploadProgress > 0 && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">Progression de l'envoi : {Math.round(uploadProgress)}%</p>
              </div>
            )}
            <p className="progress-status">{status}</p>
            <p className="progress-hint">
              Temps restant estimé : {formatTime(timeRemaining)}
              <br />
              Le traitement peut prendre plusieurs minutes selon la taille du fichier.
              Veuillez ne pas fermer cette page pendant le traitement.
            </p>
          </div>
        )}

        {response && (
          <div className="response-container">
            <h4>Réponse du serveur :</h4>
            <pre className="response-pre">{JSON.stringify(response, null, 2)}</pre>
            
            <div className="download-section">
              <div className="form-group">
                <label>Nom du fichier à télécharger :</label>
                <input
                  type="text"
                  value={downloadFileName}
                  onChange={(e) => setDownloadFileName(e.target.value)}
                  className="text-input"
                  placeholder="nom_du_fichier.tex"
                />
              </div>
              
              <button 
                onClick={handleDownload}
                className="download-button"
              >
                Télécharger le fichier .tex
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default UploadForm;